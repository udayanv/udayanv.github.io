import { describe, expect, it } from 'vitest'
import { oklabToOklch, isInSrgbGamut } from '../color/conversion'
import { SeededRandom } from '../../infrastructure/random'
import { RelativeShiftGenerator, relativeShiftDifferences } from './relativeShift'
import type { DifficultyBand, R1Skill } from './types'

describe('relative shift generation', () => {
  it('changes only lightness for a lightness question', () => {
    const exercise = new RelativeShiftGenerator(new SeededRandom(7)).generate({ skill: 'lightness', difficulty: 'medium' })
    const left = oklabToOklch(exercise.question.left)
    const right = oklabToOklch(exercise.question.right)
    expect(left.C).toBeCloseTo(right.C, 8)
    expect(left.h).toBeCloseTo(right.h, 8)
    expect(left.L).not.toBeCloseTo(right.L, 3)
  })

  it('changes only chroma and keeps both colors display safe', () => {
    const exercise = new RelativeShiftGenerator(new SeededRandom(12)).generate({ skill: 'chroma', difficulty: 'hard' })
    const left = oklabToOklch(exercise.question.left)
    const right = oklabToOklch(exercise.question.right)
    expect(left.L).toBeCloseTo(right.L, 8)
    expect(left.h).toBeCloseTo(right.h, 8)
    expect(left.C).not.toBeCloseTo(right.C, 3)
    expect(isInSrgbGamut(exercise.question.left)).toBe(true)
    expect(isInSrgbGamut(exercise.question.right)).toBe(true)
  })

  it('randomizes the answer side deterministically', () => {
    const generator = new RelativeShiftGenerator(new SeededRandom(1))
    const sides = Array.from({ length: 12 }, () =>
      generator.generate({ skill: 'lightness', difficulty: 'easy' }).correctAnswer,
    )
    expect(new Set(sides)).toEqual(new Set(['left', 'right']))
  })

  it.each([
    ['lightness', 'easy'], ['lightness', 'medium'], ['lightness', 'hard'],
    ['chroma', 'easy'], ['chroma', 'medium'], ['chroma', 'hard'],
  ] as const)('preserves the visible %s distinction in the %s band', (skill, difficulty) => {
    const generator = new RelativeShiftGenerator(new SeededRandom(21))
    for (let index = 0; index < 18; index += 1) {
      const exercise = generator.generate({ skill, difficulty })
      const left = oklabToOklch(exercise.question.left)
      const right = oklabToOklch(exercise.question.right)
      const difference = skill === 'lightness'
        ? Math.abs(left.L - right.L)
        : Math.abs(left.C - right.C)
      expect(difference).toBeGreaterThanOrEqual(
        relativeShiftDifferences[skill as R1Skill][difficulty as DifficultyBand] * 0.99,
      )
      expect(isInSrgbGamut(exercise.question.left)).toBe(true)
      expect(isInSrgbGamut(exercise.question.right)).toBe(true)
    }
  })
})
