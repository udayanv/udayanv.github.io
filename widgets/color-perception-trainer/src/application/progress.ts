import type { DifficultyBand, DifficultyMode, R1Skill } from '../domain/exercises/types'

export interface PerformanceTotal {
  attempted: number
  correct: number
}

export interface SkillProgress extends PerformanceTotal {
  byBand: Record<DifficultyBand, PerformanceTotal>
}

export interface ProgressSnapshot {
  version: 3
  skills: Record<R1Skill, SkillProgress>
  difficultyMode: Record<R1Skill, DifficultyMode>
  hiddenUndertone: {
    overall: SkillProgress
    family: SkillProgress
    lean: SkillProgress
    difficultyMode: DifficultyMode
  }
}

const emptyTotal = (): PerformanceTotal => ({ attempted: 0, correct: 0 })

const emptySkillProgress = (): SkillProgress => ({
  ...emptyTotal(),
  byBand: {
    easy: emptyTotal(),
    medium: emptyTotal(),
    hard: emptyTotal(),
  },
})

export const emptyProgress = (): ProgressSnapshot => ({
  version: 3,
  skills: {
    lightness: emptySkillProgress(),
    chroma: emptySkillProgress(),
  },
  difficultyMode: {
    lightness: 'auto',
    chroma: 'auto',
  },
  hiddenUndertone: {
    overall: emptySkillProgress(),
    family: emptySkillProgress(),
    lean: emptySkillProgress(),
    difficultyMode: 'auto',
  },
})

function recordPerformance(
  progress: SkillProgress,
  band: DifficultyBand,
  isCorrect: boolean,
): SkillProgress {
  const currentBand = progress.byBand[band]
  return {
    attempted: progress.attempted + 1,
    correct: progress.correct + Number(isCorrect),
    byBand: {
      ...progress.byBand,
      [band]: {
        attempted: currentBand.attempted + 1,
        correct: currentBand.correct + Number(isCorrect),
      },
    },
  }
}

export function recordAnswer(
  snapshot: ProgressSnapshot,
  skill: R1Skill,
  band: DifficultyBand,
  isCorrect: boolean,
): ProgressSnapshot {
  return {
    ...snapshot,
    skills: {
      ...snapshot.skills,
      [skill]: recordPerformance(snapshot.skills[skill], band, isCorrect),
    },
  }
}

export function recordHiddenUndertoneAnswer(
  snapshot: ProgressSnapshot,
  band: DifficultyBand,
  outcome: { familyCorrect: boolean; leanCorrect: boolean; isCorrect: boolean },
): ProgressSnapshot {
  return {
    ...snapshot,
    hiddenUndertone: {
      ...snapshot.hiddenUndertone,
      overall: recordPerformance(snapshot.hiddenUndertone.overall, band, outcome.isCorrect),
      family: recordPerformance(snapshot.hiddenUndertone.family, band, outcome.familyCorrect),
      lean: recordPerformance(snapshot.hiddenUndertone.lean, band, outcome.leanCorrect),
    },
  }
}

export function setDifficultyMode(
  snapshot: ProgressSnapshot,
  skill: R1Skill,
  mode: DifficultyMode,
): ProgressSnapshot {
  return {
    ...snapshot,
    difficultyMode: { ...snapshot.difficultyMode, [skill]: mode },
  }
}

export function setHiddenUndertoneDifficultyMode(
  snapshot: ProgressSnapshot,
  mode: DifficultyMode,
): ProgressSnapshot {
  return {
    ...snapshot,
    hiddenUndertone: { ...snapshot.hiddenUndertone, difficultyMode: mode },
  }
}
