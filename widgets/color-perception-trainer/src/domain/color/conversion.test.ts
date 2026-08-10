import { describe, expect, it } from 'vitest'
import { gamutMap, isInSrgbGamut, oklabToOklch, oklchToOklab } from './conversion'

describe('color conversion', () => {
  it('round trips OKLCH through the canonical OKLab representation', () => {
    const source = { L: 0.64, C: 0.18, h: 355 }
    const result = oklabToOklch(oklchToOklab(source))
    expect(result.L).toBeCloseTo(source.L, 8)
    expect(result.C).toBeCloseTo(source.C, 8)
    expect(result.h).toBeCloseTo(source.h, 8)
  })

  it('maps extreme chroma into sRGB while retaining lightness and hue', () => {
    const source = oklchToOklab({ L: 0.65, C: 0.4, h: 35 })
    const mapped = gamutMap(source)
    expect(isInSrgbGamut(mapped)).toBe(true)
    expect(mapped.L).toBeCloseTo(source.L, 8)
    expect(oklabToOklch(mapped).h).toBeCloseTo(oklabToOklch(source).h, 6)
  })
})
