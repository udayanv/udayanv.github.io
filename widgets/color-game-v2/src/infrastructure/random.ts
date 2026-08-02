import type { RandomSource } from '../domain/ports/randomSource'

export type { RandomSource } from '../domain/ports/randomSource'

export class BrowserRandom implements RandomSource {
  next(): number {
    return Math.random()
  }
}

export class SeededRandom implements RandomSource {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0
  }

  next(): number {
    this.state += 0x6d2b79f5
    let value = this.state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}
