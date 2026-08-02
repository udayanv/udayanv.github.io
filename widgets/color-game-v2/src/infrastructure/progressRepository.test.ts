import { describe, expect, it } from 'vitest'
import { emptyProgress, recordAnswer } from '../application/progress'
import { LocalStorageProgressRepository } from './progressRepository'

describe('progress repository', () => {
  it('stores lightness and chroma separately', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value) },
    }
    const repository = new LocalStorageProgressRepository(storage)
    repository.save(recordAnswer(emptyProgress(), 'lightness', 'medium', true))
    expect(repository.load().skills.lightness.attempted).toBe(1)
    expect(repository.load().skills.lightness.correct).toBe(1)
    expect(repository.load().skills.lightness.byBand.medium).toEqual({ attempted: 1, correct: 1 })
    expect(repository.load().skills.chroma.attempted).toBe(0)
  })

  it('falls back safely when storage fails', () => {
    const repository = new LocalStorageProgressRepository({
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
    })
    expect(repository.load()).toEqual(emptyProgress())
    expect(() => repository.save(emptyProgress())).not.toThrow()
  })

  it('migrates version 1 totals without assigning them to a difficulty band', () => {
    const values = new Map<string, string>([[
      'color-perception-trainer.progress.v1',
      JSON.stringify({
        version: 1,
        skills: {
          lightness: { attempted: 8, correct: 5 },
          chroma: { attempted: 3, correct: 1 },
        },
      }),
    ]])
    const repository = new LocalStorageProgressRepository({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value) },
    })

    const result = repository.load()
    expect(result.version).toBe(3)
    expect(result.skills.lightness.attempted).toBe(8)
    expect(result.skills.lightness.byBand.easy.attempted).toBe(0)
    expect(result.difficultyMode.lightness).toBe('auto')
    expect(result.hiddenUndertone.overall.attempted).toBe(0)
  })

  it('migrates version 2 progress and initializes R2 independently', () => {
    const version2 = emptyProgress()
    const repository = new LocalStorageProgressRepository({
      getItem: () => JSON.stringify({
        version: 2,
        skills: version2.skills,
        difficultyMode: { lightness: 'medium', chroma: 'auto' },
      }),
      setItem: () => undefined,
    })
    const result = repository.load()
    expect(result.version).toBe(3)
    expect(result.difficultyMode.lightness).toBe('medium')
    expect(result.hiddenUndertone.difficultyMode).toBe('auto')
  })

  it('rejects impossible or malformed persisted totals', () => {
    const repository = new LocalStorageProgressRepository({
      getItem: () => JSON.stringify({
        version: 1,
        skills: {
          lightness: { attempted: 1, correct: 2 },
          chroma: { attempted: 0, correct: 0 },
        },
      }),
      setItem: () => undefined,
    })
    expect(repository.load()).toEqual(emptyProgress())
  })
})
