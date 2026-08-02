import {
  gamutMap,
  isInSrgbGamut,
  maxSrgbChroma,
  oklabToOklch,
  oklchToOklab,
} from '../color/conversion'
import { palette } from '../palette/palette'
import type { RandomSource } from '../ports/randomSource'
import { generateValidated } from './generation'
import type {
  DifficultyBand,
  ExerciseGenerator,
  HiddenUndertoneAnswer,
  HiddenUndertoneExercise,
  HiddenUndertoneFeedbackData,
  HiddenUndertoneGenerationRequest,
  HiddenUndertoneQuestion,
} from './types'

interface NormalizedChromaRange {
  minimum: number
  maximum: number
}

export const hiddenUndertoneRanges: Record<DifficultyBand, NormalizedChromaRange> = {
  easy: { minimum: 0.3, maximum: 0.4 },
  medium: { minimum: 0.2, maximum: 0.3 },
  hard: { minimum: 0.12, maximum: 0.2 },
}

const operationalNeutralMaximum = 0.015
const hardMinimumChroma = 0.025

export class HiddenUndertoneGenerator implements ExerciseGenerator<
  HiddenUndertoneGenerationRequest,
  HiddenUndertoneQuestion,
  HiddenUndertoneAnswer,
  HiddenUndertoneFeedbackData
> {
  constructor(private readonly random: RandomSource) {}

  generate(input: HiddenUndertoneGenerationRequest): HiddenUndertoneExercise {
    return generateValidated(
      () => this.createCandidate(input),
      (exercise) => this.isFairQuestion(exercise),
    )
  }

  private createCandidate(input: HiddenUndertoneGenerationRequest): HiddenUndertoneExercise {
    const anchor = palette[Math.floor(this.random.next() * palette.length)]
    const anchorHue = oklabToOklch(anchor.color).h
    const L = 0.44 + this.random.next() * 0.36
    const range = hiddenUndertoneRanges[input.difficulty]
    const normalizedChroma = range.minimum +
      this.random.next() * (range.maximum - range.minimum)
    const C = maxSrgbChroma(L, anchorHue) * normalizedChroma
    const color = gamutMap(oklchToOklab({ L, C, h: anchorHue }))

    return {
      id: `hidden-undertone-${anchor.id}-${Math.floor(this.random.next() * 1e9)}`,
      skill: 'undertone',
      difficulty: input.difficulty,
      question: {
        prompt: 'Which learning anchor is hiding in this muted color?',
        color,
      },
      correctAnswer: { family: anchor.family, lean: anchor.lean },
      feedback: {
        anchorId: anchor.id,
        anchorName: anchor.name,
        explanation: 'This answer follows the app’s screen reference for the named paint. Real watercolor appearance varies with water, paper, and lighting.',
      },
    }
  }

  private isFairQuestion(exercise: HiddenUndertoneExercise): boolean {
    const color = gamutMap(exercise.question.color)
    const { C, h } = oklabToOklch(color)
    const maximum = maxSrgbChroma(color.L, h)
    const normalizedChroma = maximum > 0 ? C / maximum : 0
    const range = hiddenUndertoneRanges[exercise.difficulty]
    const anchor = palette.find(({ id }) => id === exercise.feedback.anchorId)
    if (!anchor) return false
    const anchorHue = oklabToOklch(anchor.color).h
    const hueDifference = Math.abs(h - anchorHue)
    const wrappedHueDifference = Math.min(hueDifference, 360 - hueDifference)

    return isInSrgbGamut(color) &&
      C > operationalNeutralMaximum &&
      (exercise.difficulty !== 'hard' || C >= hardMinimumChroma) &&
      normalizedChroma >= range.minimum - 1e-5 &&
      normalizedChroma <= range.maximum + 1e-5 &&
      wrappedHueDifference < 1e-5
  }
}
