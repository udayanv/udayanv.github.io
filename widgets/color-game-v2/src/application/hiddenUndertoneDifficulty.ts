import type { DifficultyBand, DifficultyMode, DifficultyPolicy } from '../domain/exercises/types'
import type { SkillProgress } from './progress'

export function resolveHiddenUndertoneDifficulty(
  mode: DifficultyMode,
  overallProgress: SkillProgress,
): DifficultyBand {
  if (mode !== 'auto') return mode
  if (overallProgress.attempted >= 15 && overallProgress.correct / overallProgress.attempted >= 0.7) return 'hard'
  if (overallProgress.attempted >= 5 && overallProgress.correct / overallProgress.attempted >= 0.6) return 'medium'
  return 'easy'
}

export const hiddenUndertoneDifficultyPolicy: DifficultyPolicy<SkillProgress> = {
  resolve: resolveHiddenUndertoneDifficulty,
}
