import { maxSrgbChroma, oklabToOklch, oklchToOklab } from '../color/conversion'
import { palette } from '../palette/palette'
import type { RandomSource } from '../../infrastructure/random'
import type {
  Exercise,
  ExerciseGenerator,
  GenerationRequest,
  RelativeShiftQuestion,
  R1Skill,
  SwatchSide,
} from './types'

const lightnessSteps = [0.14, 0.1, 0.075]
const chromaSteps = [0.08, 0.06, 0.045]

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

function bandValue(values: number[], difficulty: number): number {
  return values[Math.max(0, Math.min(values.length - 1, difficulty - 1))]
}

export class RelativeShiftGenerator implements ExerciseGenerator {
  constructor(private readonly random: RandomSource) {}

  generate(
    input: GenerationRequest,
  ): Exercise<RelativeShiftQuestion, SwatchSide> {
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

  private makeLightnessPair(baseL: number, h: number, difficulty: number) {
    const difference = bandValue(lightnessSteps, difficulty)
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

  private makeChromaPair(L: number, h: number, difficulty: number) {
    const safeL = Math.min(0.8, Math.max(0.48, L))
    const difference = bandValue(chromaSteps, difficulty)
    const maxC = maxSrgbChroma(safeL, h) * 0.84
    const highC = Math.min(maxC, 0.19)
    const lowC = Math.max(0.025, highC - difference)
    return [
      oklchToOklab({ L: safeL, C: lowC, h }),
      oklchToOklab({ L: safeL, C: highC, h }),
    ]
  }
}

export function skillLabel(skill: R1Skill): string {
  return skill === 'lightness' ? 'Lightness' : 'Chroma'
}
