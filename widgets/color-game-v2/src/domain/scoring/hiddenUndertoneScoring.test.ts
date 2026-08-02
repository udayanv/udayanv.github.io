import { describe, expect, it } from 'vitest'
import { evaluateHiddenUndertoneAnswer } from './hiddenUndertoneScoring'

describe('Hidden Undertone scoring', () => {
  const correct = { family: 'red', lean: 'warm' } as const

  it('scores both stages and combined correctness', () => {
    expect(evaluateHiddenUndertoneAnswer(correct, correct)).toMatchObject({
      familyCorrect: true, leanCorrect: true, isCorrect: true,
    })
    expect(evaluateHiddenUndertoneAnswer({ family: 'red', lean: 'cool' }, correct)).toMatchObject({
      familyCorrect: true, leanCorrect: false, isCorrect: false,
    })
    expect(evaluateHiddenUndertoneAnswer({ family: 'blue', lean: 'warm' }, correct)).toMatchObject({
      familyCorrect: false, leanCorrect: true, isCorrect: false,
    })
  })
})
