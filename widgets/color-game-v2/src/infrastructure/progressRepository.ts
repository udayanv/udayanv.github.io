import type { ProgressRepository } from '../application/ports/progressRepository'
import {
  emptyProgress,
  type PerformanceTotal,
  type ProgressSnapshot,
  type SkillProgress,
} from '../application/progress'
import type { DifficultyMode } from '../domain/exercises/types'

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

interface Version1ProgressSnapshot {
  version: 1
  skills: { lightness: PerformanceTotal; chroma: PerformanceTotal }
}

interface Version2ProgressSnapshot {
  version: 2
  skills: { lightness: SkillProgress; chroma: SkillProgress }
  difficultyMode: { lightness: DifficultyMode; chroma: DifficultyMode }
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

function isSkillProgress(value: unknown): value is SkillProgress {
  if (!isTotal(value)) return false
  const progress = value as Partial<SkillProgress>
  return bands.every((band) => isTotal(progress.byBand?.[band]))
}

function isMode(value: unknown): value is DifficultyMode {
  return typeof value === 'string' && modes.has(value)
}

function isSnapshot(value: unknown): value is ProgressSnapshot {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ProgressSnapshot>
  return candidate.version === 3 &&
    isSkillProgress(candidate.skills?.lightness) &&
    isSkillProgress(candidate.skills?.chroma) &&
    isMode(candidate.difficultyMode?.lightness) &&
    isMode(candidate.difficultyMode?.chroma) &&
    isSkillProgress(candidate.hiddenUndertone?.overall) &&
    isSkillProgress(candidate.hiddenUndertone?.family) &&
    isSkillProgress(candidate.hiddenUndertone?.lean) &&
    isMode(candidate.hiddenUndertone?.difficultyMode)
}

function isVersion2Snapshot(value: unknown): value is Version2ProgressSnapshot {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<Version2ProgressSnapshot>
  return candidate.version === 2 &&
    isSkillProgress(candidate.skills?.lightness) &&
    isSkillProgress(candidate.skills?.chroma) &&
    isMode(candidate.difficultyMode?.lightness) &&
    isMode(candidate.difficultyMode?.chroma)
}

function isVersion1Snapshot(value: unknown): value is Version1ProgressSnapshot {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<Version1ProgressSnapshot>
  return candidate.version === 1 &&
    isTotal(candidate.skills?.lightness) && isTotal(candidate.skills?.chroma)
}

function migrateVersion2(snapshot: Version2ProgressSnapshot): ProgressSnapshot {
  return {
    ...emptyProgress(),
    skills: snapshot.skills,
    difficultyMode: snapshot.difficultyMode,
  }
}

function migrateVersion1(snapshot: Version1ProgressSnapshot): ProgressSnapshot {
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
      if (isVersion2Snapshot(parsed)) return migrateVersion2(parsed)
      if (isVersion1Snapshot(parsed)) return migrateVersion1(parsed)
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
