import { emptyProgress, type ProgressSnapshot } from '../application/progress'

export interface ProgressRepository {
  load(): ProgressSnapshot
  save(snapshot: ProgressSnapshot): void
}

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

const storageKey = 'color-perception-trainer.progress.v1'

function isSnapshot(value: unknown): value is ProgressSnapshot {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ProgressSnapshot>
  return (
    candidate.version === 1 &&
    typeof candidate.skills?.lightness?.attempted === 'number' &&
    typeof candidate.skills?.lightness?.correct === 'number' &&
    typeof candidate.skills?.chroma?.attempted === 'number' &&
    typeof candidate.skills?.chroma?.correct === 'number'
  )
}

export class LocalStorageProgressRepository implements ProgressRepository {
  constructor(private readonly storage: StorageLike) {}

  load(): ProgressSnapshot {
    try {
      const saved = this.storage.getItem(storageKey)
      if (!saved) return emptyProgress()
      const parsed: unknown = JSON.parse(saved)
      return isSnapshot(parsed) ? parsed : emptyProgress()
    } catch {
      return emptyProgress()
    }
  }

  save(snapshot: ProgressSnapshot): void {
    try {
      this.storage.setItem(storageKey, JSON.stringify(snapshot))
    } catch {
      // Practice remains usable when storage is unavailable or full.
    }
  }
}
