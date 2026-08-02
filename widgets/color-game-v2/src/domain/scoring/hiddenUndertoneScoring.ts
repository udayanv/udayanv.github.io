import type { HiddenUndertoneAnswer } from '../exercises/types'

export interface HiddenUndertoneOutcome {
  selected: HiddenUndertoneAnswer
  correctAnswer: HiddenUndertoneAnswer
  familyCorrect: boolean
  leanCorrect: boolean
  isCorrect: boolean
}

export function evaluateHiddenUndertoneAnswer(
  selected: HiddenUndertoneAnswer,
  correctAnswer: HiddenUndertoneAnswer,
): HiddenUndertoneOutcome {
  const familyCorrect = selected.family === correctAnswer.family
  const leanCorrect = selected.lean === correctAnswer.lean
  return {
    selected,
    correctAnswer,
    familyCorrect,
    leanCorrect,
    isCorrect: familyCorrect && leanCorrect,
  }
}
