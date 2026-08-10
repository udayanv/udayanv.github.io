import { describe, expect, it } from 'vitest'
import { emptyProgress } from './progress'
import { resolveHiddenUndertoneDifficulty } from './hiddenUndertoneDifficulty'

function progress(attempted: number, correct: number) {
  return { ...emptyProgress().hiddenUndertone.overall, attempted, correct }
}

describe('Hidden Undertone difficulty policy', () => {
  it('keeps manual modes independent from Auto', () => {
    expect(resolveHiddenUndertoneDifficulty('easy', progress(20, 20))).toBe('easy')
    expect(resolveHiddenUndertoneDifficulty('hard', progress(0, 0))).toBe('hard')
  })

  it('uses overall combined question performance for Auto', () => {
    expect(resolveHiddenUndertoneDifficulty('auto', progress(4, 4))).toBe('easy')
    expect(resolveHiddenUndertoneDifficulty('auto', progress(5, 3))).toBe('medium')
    expect(resolveHiddenUndertoneDifficulty('auto', progress(15, 10))).toBe('medium')
    expect(resolveHiddenUndertoneDifficulty('auto', progress(15, 11))).toBe('hard')
  })
})
