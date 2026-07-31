import { describe, expect, it } from 'vitest'
import { oklabToOklch, isInSrgbGamut } from '../color/conversion'
import { SeededRandom } from '../../infrastructure/random'
import { RelativeShiftGenerator } from './relativeShift'

describe('relative shift generation', () => {
  it('changes only lightness for a lightness question', () => {
    const exercise = new RelativeShiftGenerator(new SeededRandom(7)).generate({ skill: 'lightness', difficulty: 2 })
    const left = oklabToOklch(exercise.question.left)
    const right = oklabToOklch(exercise.question.right)
    expect(left.C).toBeCloseTo(right.C, 8)
    expect(left.h).toBeCloseTo(right.h, 8)
    expect(left.L).not.toBeCloseTo(right.L, 3)
  })

  it('changes only chroma and keeps both colors display safe', () => {
    const exercise = new RelativeShiftGenerator(new SeededRandom(12)).generate({ skill: 'chroma', difficulty: 3 })
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
      generator.generate({ skill: 'lightness', difficulty: 1 }).correctAnswer,
    )
    expect(new Set(sides)).toEqual(new Set(['left', 'right']))
  })
})
