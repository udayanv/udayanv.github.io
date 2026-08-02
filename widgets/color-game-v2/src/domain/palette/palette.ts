import { oklchToOklab, toDisplayColor } from '../color/conversion'
import type { ColorSample } from '../color/types'

export interface PaletteAnchor {
  id: string
  name: string
  color: ColorSample
}

const definitions = [
  ['cool-yellow', 'Cool Yellow', 0.93, 0.17, 110],
  ['warm-yellow', 'Warm Yellow', 0.91, 0.17, 90],
  ['cool-red', 'Cool Red', 0.62, 0.24, 355],
  ['warm-red', 'Warm Red', 0.64, 0.23, 30],
  ['cool-blue', 'Cool Blue', 0.6, 0.18, 235],
  ['warm-blue', 'Warm Blue', 0.56, 0.18, 285],
] as const

export const palette: PaletteAnchor[] = definitions.map(([id, name, L, C, h]) => ({
  id,
  name,
  color: oklchToOklab({ L, C, h }),
}))

export const paletteDisplay = palette.map((anchor) => ({
  ...anchor,
  css: toDisplayColor(anchor.color).css,
}))
