import { describe, expect, it } from 'vitest'
import { isInSrgbGamut } from '../color/conversion'
import { palette } from './palette'

describe('virtual palette', () => {
  it('keeps every family ordered cool then warm', () => {
    expect(palette.map(({ id }) => id)).toEqual([
      'cool-yellow', 'warm-yellow',
      'cool-red', 'warm-red',
      'cool-blue', 'warm-blue',
    ])
  })

  it('uses the six DANIEL SMITH Essentials paint names', () => {
    expect(palette.map(({ name }) => name)).toEqual([
      'Hansa Yellow Light',
      'New Gamboge',
      'Quinacridone Rose',
      'Pyrrol Scarlet',
      'Phthalo Blue (Green Shade)',
      'French Ultramarine Blue',
    ])
  })

  it('keeps every reference color inside sRGB', () => {
    expect(palette.every(({ color }) => isInSrgbGamut(color))).toBe(true)
  })
})
