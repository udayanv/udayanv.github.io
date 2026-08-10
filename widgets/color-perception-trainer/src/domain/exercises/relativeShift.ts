import { gamutMap, isInSrgbGamut, maxSrgbChroma, oklabToOklch, oklchToOklab } from '../color/conversion'
import { palette } from '../palette/palette'
import type { RandomSource } from '../ports/randomSource'
import type {
  Exercise,
  ExerciseGenerator,
  GenerationRequest,
  RelativeShiftQuestion,
  DifficultyBand,
  R1Skill,
  SwatchSide,
  RelativeShiftFeedbackData,
} from './types'
import { generateValidated } from './generation'

export const relativeShiftDifferences: Record<R1Skill, Record<DifficultyBand, number>> = {
  lightness: { easy: 0.14, medium: 0.1, hard: 0.075 },
  chroma: { easy: 0.08, medium: 0.06, hard: 0.045 },
}

const copy = {
  lightness: {
    prompt: 'Which color is lighter?',
    direction: 'lighter' as const,
    explanation: 'Lightness describes how close a color is to white or black.',
  },
  chroma: {
    prompt: 'Which color is more vivid?',
    direction: 'more vivid' as const,
    explanation: 'Chroma describes how strong or muted a color appears.',
  },
}

export class RelativeShiftGenerator implements ExerciseGenerator<
  GenerationRequest,
  RelativeShiftQuestion,
  SwatchSide,
  RelativeShiftFeedbackData
> {
  constructor(private readonly random: RandomSource) {}

  generate(
    input: GenerationRequest,
  ): Exercise<RelativeShiftQuestion, SwatchSide, RelativeShiftFeedbackData> {
    return generateValidated(
      () => this.createCandidate(input),
      (exercise) => this.isFairQuestion(exercise),
    )
  }

  private createCandidate(
    input: GenerationRequest,
  ): Exercise<RelativeShiftQuestion, SwatchSide, RelativeShiftFeedbackData> {
    const anchor = palette[Math.floor(this.random.next() * palette.length)]
    const anchorLch = oklabToOklch(anchor.color)
    const correctSide: SwatchSide = this.random.next() < 0.5 ? 'left' : 'right'
    const colors =
      input.skill === 'lightness'
        ? this.makeLightnessPair(anchorLch.L, anchorLch.h, input.difficulty)
        : this.makeChromaPair(anchorLch.L, anchorLch.h, input.difficulty)
    const [lower, higher] = colors
    const left = correctSide === 'left' ? higher : lower
    const right = correctSide === 'right' ? higher : lower
    const language = copy[input.skill]

    return {
      id: `relative-shift-${input.skill}-${Math.floor(this.random.next() * 1e9)}`,
      skill: input.skill,
      difficulty: input.difficulty,
      question: { prompt: language.prompt, left, right },
      correctAnswer: correctSide,
      feedback: {
        skill: input.skill,
        correctSide,
        direction: language.direction,
        explanation: language.explanation,
      },
    }
  }

  private makeLightnessPair(baseL: number, h: number, difficulty: DifficultyBand) {
    const difference = relativeShiftDifferences.lightness[difficulty]
    const center = Math.min(0.78, Math.max(0.4, baseL))
    const lowL = center - difference / 2
    const highL = center + difference / 2
    const safeC =
      Math.min(maxSrgbChroma(lowL, h), maxSrgbChroma(highL, h), 0.17) * 0.82
    return [
      oklchToOklab({ L: lowL, C: safeC, h }),
      oklchToOklab({ L: highL, C: safeC, h }),
    ]
  }

  private makeChromaPair(L: number, h: number, difficulty: DifficultyBand) {
    const safeL = Math.min(0.8, Math.max(0.48, L))
    const difference = relativeShiftDifferences.chroma[difficulty]
    const maxC = maxSrgbChroma(safeL, h) * 0.84
    const highC = Math.min(maxC, 0.19)
    const lowC = Math.max(0.025, highC - difference)
    return [
      oklchToOklab({ L: safeL, C: lowC, h }),
      oklchToOklab({ L: safeL, C: highC, h }),
    ]
  }

  private isFairQuestion(exercise: Exercise<RelativeShiftQuestion, SwatchSide, RelativeShiftFeedbackData>): boolean {
    const left = gamutMap(exercise.question.left)
    const right = gamutMap(exercise.question.right)
    const leftLch = oklabToOklch(left)
    const rightLch = oklabToOklch(right)
    const expected = relativeShiftDifferences[exercise.skill as R1Skill][exercise.difficulty]
    const visibleDifference = exercise.skill === 'lightness'
      ? Math.abs(left.L - right.L)
      : Math.abs(leftLch.C - rightLch.C)
    const unchangedDimension = exercise.skill === 'lightness'
      ? Math.abs(leftLch.C - rightLch.C)
      : Math.abs(left.L - right.L)
    const hueDifference = Math.abs(leftLch.h - rightLch.h)
    const wrappedHueDifference = Math.min(hueDifference, 360 - hueDifference)

    return isInSrgbGamut(left) && isInSrgbGamut(right) &&
      visibleDifference >= expected * 0.99 &&
      unchangedDimension < 1e-6 && wrappedHueDifference < 1e-6
  }
}

export function skillLabel(skill: R1Skill): string {
  return skill === 'lightness' ? 'Lightness' : 'Chroma'
}
