import { oklchToOklab, toDisplayColor } from '../color/conversion'
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

const definitions = [
  ['cool-yellow', 'Cool Yellow', 'yellow', 'cool', 0.93, 0.17, 110],
  ['warm-yellow', 'Warm Yellow', 'yellow', 'warm', 0.91, 0.17, 90],
  ['cool-red', 'Cool Red', 'red', 'cool', 0.62, 0.24, 355],
  ['warm-red', 'Warm Red', 'red', 'warm', 0.64, 0.23, 30],
  ['cool-blue', 'Cool Blue', 'blue', 'cool', 0.6, 0.18, 235],
  ['warm-blue', 'Warm Blue', 'blue', 'warm', 0.56, 0.18, 285],
] as const

export const palette: PaletteAnchor[] = definitions.map(([id, name, family, lean, L, C, h]) => ({
  id,
  name,
  family,
  lean,
  color: oklchToOklab({ L, C, h }),
}))

export const paletteDisplay = palette.map((anchor) => ({
  ...anchor,
  css: toDisplayColor(anchor.color).css,
}))
