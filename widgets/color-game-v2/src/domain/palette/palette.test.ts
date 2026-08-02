import { describe, expect, it } from 'vitest'
import { palette } from './palette'

describe('virtual palette', () => {
  it('keeps every family ordered cool then warm', () => {
    expect(palette.map(({ id }) => id)).toEqual([
      'cool-yellow', 'warm-yellow',
      'cool-red', 'warm-red',
      'cool-blue', 'warm-blue',
    ])
  })
})
