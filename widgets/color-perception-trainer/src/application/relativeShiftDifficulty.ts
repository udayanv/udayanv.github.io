import type { DifficultyBand, DifficultyMode, DifficultyPolicy } from '../domain/exercises/types'
import type { SkillProgress } from './progress'

export function resolveRelativeShiftDifficulty(
  mode: DifficultyMode,
  progress: SkillProgress,
): DifficultyBand {
  if (mode !== 'auto') return mode
  if (progress.attempted >= 15 && progress.correct / progress.attempted >= 0.7) return 'hard'
  if (progress.attempted >= 5 && progress.correct / progress.attempted >= 0.6) return 'medium'
  return 'easy'
}

export const relativeShiftDifficultyPolicy: DifficultyPolicy<SkillProgress> = {
  resolve: resolveRelativeShiftDifficulty,
}
