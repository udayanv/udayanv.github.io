import { describe, expect, it } from 'vitest'
import { emptyProgress, recordAnswer, recordHiddenUndertoneAnswer, setDifficultyMode, setHiddenUndertoneDifficultyMode } from './progress'

describe('progress', () => {
  it('records overall and resolved-band performance independently', () => {
    let snapshot = recordAnswer(emptyProgress(), 'chroma', 'hard', false)
    snapshot = recordAnswer(snapshot, 'chroma', 'hard', true)
    expect(snapshot.skills.chroma.attempted).toBe(2)
    expect(snapshot.skills.chroma.byBand.hard).toEqual({ attempted: 2, correct: 1 })
    expect(snapshot.skills.chroma.byBand.easy.attempted).toBe(0)
    expect(snapshot.skills.lightness.attempted).toBe(0)
  })

  it('stores a mode without rewriting performance', () => {
    const snapshot = setDifficultyMode(emptyProgress(), 'lightness', 'medium')
    expect(snapshot.difficultyMode.lightness).toBe('medium')
    expect(snapshot.difficultyMode.chroma).toBe('auto')
    expect(snapshot.skills.lightness.attempted).toBe(0)
  })

  it('records Hidden Undertone overall, family, and lean outcomes separately', () => {
    const snapshot = recordHiddenUndertoneAnswer(emptyProgress(), 'hard', {
      familyCorrect: true,
      leanCorrect: false,
      isCorrect: false,
    })
    expect(snapshot.hiddenUndertone.overall.byBand.hard).toEqual({ attempted: 1, correct: 0 })
    expect(snapshot.hiddenUndertone.family.byBand.hard).toEqual({ attempted: 1, correct: 1 })
    expect(snapshot.hiddenUndertone.lean.byBand.hard).toEqual({ attempted: 1, correct: 0 })
  })

  it('stores the Hidden Undertone mode independently', () => {
    const snapshot = setHiddenUndertoneDifficultyMode(emptyProgress(), 'hard')
    expect(snapshot.hiddenUndertone.difficultyMode).toBe('hard')
    expect(snapshot.difficultyMode.lightness).toBe('auto')
  })
})
