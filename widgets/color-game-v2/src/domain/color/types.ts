export interface ColorSample {
  L: number
  a: number
  b: number
}

export interface OklchColor {
  L: number
  C: number
  h: number
}

export interface DisplayColor {
  sample: ColorSample
  css: string
}
