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
    repository.save(recordAnswer(emptyProgress(), 'lightness', true))
    expect(repository.load().skills.lightness).toEqual({ attempted: 1, correct: 1 })
    expect(repository.load().skills.chroma).toEqual({ attempted: 0, correct: 0 })
  })

  it('falls back safely when storage fails', () => {
    const repository = new LocalStorageProgressRepository({
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
    })
    expect(repository.load()).toEqual(emptyProgress())
    expect(() => repository.save(emptyProgress())).not.toThrow()
  })
})
