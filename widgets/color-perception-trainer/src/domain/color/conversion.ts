import type { ColorSample, DisplayColor, OklchColor } from './types'

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value))

export function oklchToOklab(color: OklchColor): ColorSample {
  const radians = (color.h * Math.PI) / 180
  return {
    L: color.L,
    a: color.C * Math.cos(radians),
    b: color.C * Math.sin(radians),
  }
}

export function oklabToOklch(color: ColorSample): OklchColor {
  const h = (Math.atan2(color.b, color.a) * 180) / Math.PI
  return {
    L: color.L,
    C: Math.hypot(color.a, color.b),
    h: (h + 360) % 360,
  }
}

function toLinearSrgb(color: ColorSample): [number, number, number] {
  const lRoot = color.L + 0.3963377774 * color.a + 0.2158037573 * color.b
  const mRoot = color.L - 0.1055613458 * color.a - 0.0638541728 * color.b
  const sRoot = color.L - 0.0894841775 * color.a - 1.291485548 * color.b
  const l = lRoot ** 3
  const m = mRoot ** 3
  const s = sRoot ** 3

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

export function isInSrgbGamut(color: ColorSample): boolean {
  return toLinearSrgb(color).every((channel) => channel >= 0 && channel <= 1)
}

export function maxSrgbChroma(L: number, h: number, upperBound = 0.4): number {
  let low = 0
  let high = upperBound

  for (let index = 0; index < 24; index += 1) {
    const middle = (low + high) / 2
    if (isInSrgbGamut(oklchToOklab({ L, C: middle, h }))) low = middle
    else high = middle
  }

  return low
}

export function gamutMap(color: ColorSample): ColorSample {
  if (isInSrgbGamut(color)) return color
  const { L, C, h } = oklabToOklch(color)
  return oklchToOklab({ L: clamp(L), C: maxSrgbChroma(clamp(L), h), h })
}

function encodeSrgb(channel: number): number {
  const encoded =
    channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055
  return Math.round(clamp(encoded) * 255)
}

export function toDisplayColor(color: ColorSample): DisplayColor {
  const sample = gamutMap(color)
  const [r, g, b] = toLinearSrgb(sample).map(encodeSrgb)
  return { sample, css: `rgb(${r} ${g} ${b})` }
}
