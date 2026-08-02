import type { ProgressRepository } from '../application/ports/progressRepository'
import {
  emptyProgress,
  type PerformanceTotal,
  type ProgressSnapshot,
} from '../application/progress'

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

interface LegacyProgressSnapshot {
  version: 1
  skills: {
    lightness: PerformanceTotal
    chroma: PerformanceTotal
  }
}

const storageKey = 'color-perception-trainer.progress.v1'
const modes = new Set(['auto', 'easy', 'medium', 'hard'])
const bands = ['easy', 'medium', 'hard'] as const

function isTotal(value: unknown): value is PerformanceTotal {
  if (!value || typeof value !== 'object') return false
  const total = value as Partial<PerformanceTotal>
  return Number.isInteger(total.attempted) && Number.isInteger(total.correct) &&
    (total.attempted ?? -1) >= 0 && (total.correct ?? -1) >= 0 &&
    (total.correct ?? 1) <= (total.attempted ?? 0)
}

function isSnapshot(value: unknown): value is ProgressSnapshot {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ProgressSnapshot>
  return candidate.version === 2 &&
    isTotal(candidate.skills?.lightness) && isTotal(candidate.skills?.chroma) &&
    bands.every((band) => isTotal(candidate.skills?.lightness?.byBand?.[band])) &&
    bands.every((band) => isTotal(candidate.skills?.chroma?.byBand?.[band])) &&
    modes.has(candidate.difficultyMode?.lightness ?? '') &&
    modes.has(candidate.difficultyMode?.chroma ?? '')
}

function isLegacySnapshot(value: unknown): value is LegacyProgressSnapshot {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<LegacyProgressSnapshot>
  return candidate.version === 1 &&
    isTotal(candidate.skills?.lightness) && isTotal(candidate.skills?.chroma)
}

function migrate(snapshot: LegacyProgressSnapshot): ProgressSnapshot {
  const next = emptyProgress()
  return {
    ...next,
    skills: {
      lightness: { ...next.skills.lightness, ...snapshot.skills.lightness },
      chroma: { ...next.skills.chroma, ...snapshot.skills.chroma },
    },
  }
}

export class LocalStorageProgressRepository implements ProgressRepository {
  constructor(private readonly storage: StorageLike) {}

  load(): ProgressSnapshot {
    try {
      const saved = this.storage.getItem(storageKey)
      if (!saved) return emptyProgress()
      const parsed: unknown = JSON.parse(saved)
      if (isSnapshot(parsed)) return parsed
      if (isLegacySnapshot(parsed)) return migrate(parsed)
      return emptyProgress()
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
