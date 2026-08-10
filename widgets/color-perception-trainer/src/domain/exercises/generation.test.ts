import { describe, expect, it } from 'vitest'
import { generateValidated, QuestionGenerationError } from './generation'

describe('validated generation', () => {
  it('returns the first valid candidate within the bound', () => {
    let candidate = 0
    expect(generateValidated(() => ++candidate, (value) => value === 3, 4)).toBe(3)
  })

  it('reports a typed failure after the fixed attempt limit', () => {
    expect(() => generateValidated(() => 'invalid', () => false, 3))
      .toThrowError(QuestionGenerationError)
  })
})
