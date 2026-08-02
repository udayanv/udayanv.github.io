import { describe, expect, it } from 'vitest'
import { isInSrgbGamut, maxSrgbChroma, oklabToOklch } from '../color/conversion'
import { palette } from '../palette/palette'
import { SeededRandom } from '../../infrastructure/random'
import { HiddenUndertoneGenerator, hiddenUndertoneRanges } from './hiddenUndertone'

describe('Hidden Undertone generation', () => {
  it.each(['easy', 'medium', 'hard'] as const)('generates fair display-safe %s questions', (difficulty) => {
    const generator = new HiddenUndertoneGenerator(new SeededRandom(31))
    for (let index = 0; index < 24; index += 1) {
      const exercise = generator.generate({ difficulty })
      const lch = oklabToOklch(exercise.question.color)
      const normalized = lch.C / maxSrgbChroma(lch.L, lch.h)
      const range = hiddenUndertoneRanges[difficulty]
      expect(isInSrgbGamut(exercise.question.color)).toBe(true)
      expect(lch.C).toBeGreaterThan(0.015)
      expect(normalized).toBeGreaterThanOrEqual(range.minimum - 1e-5)
      expect(normalized).toBeLessThanOrEqual(range.maximum + 1e-5)
    }
  })

  it('uses the generated learning anchor as the objective answer', () => {
    const exercise = new HiddenUndertoneGenerator(new SeededRandom(9)).generate({ difficulty: 'medium' })
    const anchor = palette.find(({ id }) => id === exercise.feedback.anchorId)
    expect(anchor).toBeDefined()
    expect(exercise.correctAnswer).toEqual({ family: anchor?.family, lean: anchor?.lean })
    expect(exercise.feedback.anchorName).toBe(anchor?.name)
  })

  it('selects one anchor and retains it while generating the question parameters', () => {
    class CountingRandom {
      calls = 0
      next() {
        this.calls += 1
        return this.calls === 1 ? 0 : 0.5
      }
    }
    const random = new CountingRandom()
    const exercise = new HiddenUndertoneGenerator(random).generate({ difficulty: 'hard' })
    expect(exercise.feedback.anchorId).toBe('cool-yellow')
    expect(exercise.feedback.anchorName).toBe('Hansa Yellow Light')
  })
})
