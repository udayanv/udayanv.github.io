import { gamutMap, oklchToOklab, toDisplayColor } from '../color/conversion'
import type { ColorSample } from '../color/types'

export interface PaletteAnchor {
  id: VirtualAnchorId
  name: string
  family: PrimaryFamily
  lean: ColorLean
  color: ColorSample
}

export type PrimaryFamily = 'yellow' | 'red' | 'blue'
export type ColorLean = 'cool' | 'warm'
export type VirtualAnchorId = `${ColorLean}-${PrimaryFamily}`

// Conservative OKLCH screen approximations derived from DANIEL SMITH's
// published CIE Lab measurements for the six-color Essentials set.
const definitions = [
  ['cool-yellow', 'Hansa Yellow Light', 'yellow', 'cool', 0.92121, 0.19657, 107.37734],
  ['warm-yellow', 'New Gamboge', 'yellow', 'warm', 0.86354, 0.16515, 88.0828],
  ['cool-red', 'Quinacridone Rose', 'red', 'cool', 0.68129, 0.15715, 356.65572],
  ['warm-red', 'Pyrrol Scarlet', 'red', 'warm', 0.60269, 0.1975, 28.88184],
  ['cool-blue', 'Phthalo Blue (Green Shade)', 'blue', 'cool', 0.57809, 0.12321, 235.33881],
  ['warm-blue', 'French Ultramarine Blue', 'blue', 'warm', 0.59035, 0.16458, 262.41026],
] as const

export const palette: PaletteAnchor[] = definitions.map(([id, name, family, lean, L, C, h]) => ({
  id,
  name,
  family,
  lean,
  color: gamutMap(oklchToOklab({ L, C, h })),
}))

export const paletteDisplay = palette.map((anchor) => ({
  ...anchor,
  css: toDisplayColor(anchor.color).css,
}))
