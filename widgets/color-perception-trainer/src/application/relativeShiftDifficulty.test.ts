import { describe, expect, it } from 'vitest'
import { emptyProgress } from './progress'
import { resolveRelativeShiftDifficulty } from './relativeShiftDifficulty'

function progress(attempted: number, correct: number) {
  return { ...emptyProgress().skills.lightness, attempted, correct }
}

describe('Relative Shift difficulty policy', () => {
  it('honors each manual mode regardless of performance', () => {
    expect(resolveRelativeShiftDifficulty('easy', progress(100, 100))).toBe('easy')
    expect(resolveRelativeShiftDifficulty('medium', progress(0, 0))).toBe('medium')
    expect(resolveRelativeShiftDifficulty('hard', progress(0, 0))).toBe('hard')
  })

  it('advances Auto only at the exercise thresholds', () => {
    expect(resolveRelativeShiftDifficulty('auto', progress(4, 4))).toBe('easy')
    expect(resolveRelativeShiftDifficulty('auto', progress(5, 3))).toBe('medium')
    expect(resolveRelativeShiftDifficulty('auto', progress(15, 10))).toBe('medium')
    expect(resolveRelativeShiftDifficulty('auto', progress(15, 11))).toBe('hard')
  })
})
