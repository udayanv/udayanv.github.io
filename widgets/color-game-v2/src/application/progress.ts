import type { DifficultyBand, DifficultyMode, R1Skill } from '../domain/exercises/types'

export interface PerformanceTotal {
  attempted: number
  correct: number
}

export interface SkillProgress extends PerformanceTotal {
  byBand: Record<DifficultyBand, PerformanceTotal>
}

export interface ProgressSnapshot {
  version: 2
  skills: Record<R1Skill, SkillProgress>
  difficultyMode: Record<R1Skill, DifficultyMode>
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
  version: 2,
  skills: {
    lightness: emptySkillProgress(),
    chroma: emptySkillProgress(),
  },
  difficultyMode: {
    lightness: 'auto',
    chroma: 'auto',
  },
})

export function recordAnswer(
  snapshot: ProgressSnapshot,
  skill: R1Skill,
  band: DifficultyBand,
  isCorrect: boolean,
): ProgressSnapshot {
  const current = snapshot.skills[skill]
  const currentBand = current.byBand[band]
  return {
    ...snapshot,
    skills: {
      ...snapshot.skills,
      [skill]: {
        attempted: current.attempted + 1,
        correct: current.correct + Number(isCorrect),
        byBand: {
          ...current.byBand,
          [band]: {
            attempted: currentBand.attempted + 1,
            correct: currentBand.correct + Number(isCorrect),
          },
        },
      },
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
