import type { SwatchSide } from '../exercises/types'

export interface AnswerOutcome {
  selected: SwatchSide
  correctAnswer: SwatchSide
  isCorrect: boolean
}

export function evaluateAnswer(
  selected: SwatchSide,
  correctAnswer: SwatchSide,
): AnswerOutcome {
  return { selected, correctAnswer, isCorrect: selected === correctAnswer }
}
