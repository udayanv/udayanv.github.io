import type { R1Skill } from '../domain/exercises/types'

export interface SkillProgress {
  attempted: number
  correct: number
}

export interface ProgressSnapshot {
  version: 1
  skills: Record<R1Skill, SkillProgress>
}

export const emptyProgress = (): ProgressSnapshot => ({
  version: 1,
  skills: {
    lightness: { attempted: 0, correct: 0 },
    chroma: { attempted: 0, correct: 0 },
  },
})

export function recordAnswer(
  snapshot: ProgressSnapshot,
  skill: R1Skill,
  isCorrect: boolean,
): ProgressSnapshot {
  const current = snapshot.skills[skill]
  return {
    ...snapshot,
    skills: {
      ...snapshot.skills,
      [skill]: {
        attempted: current.attempted + 1,
        correct: current.correct + Number(isCorrect),
      },
    },
  }
}

export function difficultyFor(progress: SkillProgress): number {
  if (progress.attempted >= 15 && progress.correct / progress.attempted >= 0.7) return 3
  if (progress.attempted >= 5 && progress.correct / progress.attempted >= 0.6) return 2
  return 1
}
