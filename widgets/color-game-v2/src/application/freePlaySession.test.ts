import { describe, expect, it } from 'vitest'
import type { Exercise } from '../domain/exercises/types'
import { QuestionGenerationError } from '../domain/exercises/generation'
import { nextSessionQuestion, startSession, submitSessionAnswer } from './freePlaySession'

function exercise(id: string, correctAnswer = 'left'): Exercise<
  { id: string },
  string,
  { skill: 'lightness'; correctSide: 'left'; direction: 'lighter'; explanation: string }
> {
  return {
    id,
    skill: 'lightness',
    difficulty: 'easy',
    question: { id },
    correctAnswer,
    feedback: {
      skill: 'lightness',
      correctSide: 'left',
      direction: 'lighter',
      explanation: 'Test feedback.',
    },
  }
}

describe('free-play session lifecycle', () => {
  it('creates, answers, records once, and advances', () => {
    const initial = startSession(() => exercise('one'))
    const answered = submitSessionAnswer(initial, 'left', 0, (count) => count + 1)
    expect(answered.session.phase).toBe('feedback')
    expect(answered.progress).toBe(1)

    const duplicate = submitSessionAnswer(answered.session, 'left', answered.progress, (count) => count + 1)
    expect(duplicate.progress).toBe(1)
    const next = nextSessionQuestion(answered.session, () => exercise('two'))
    expect(next.phase).toBe('question')
    if (next.phase === 'question') expect(next.exercise.id).toBe('two')
  })

  it('turns bounded generation failure into recoverable session state', () => {
    const failed = startSession(() => { throw new QuestionGenerationError(12) })
    expect(failed.phase).toBe('generation-error')
    const recovered = nextSessionQuestion(failed, () => exercise('recovered'))
    expect(recovered.phase).toBe('question')
  })

  it('supports exercise-specific equality for structured answers', () => {
    const initial = startSession(() => exercise('structured', 'left'))
    const answered = submitSessionAnswer(
      initial,
      'LEFT',
      0,
      (count) => count + 1,
      (selected, correct) => selected.toLowerCase() === correct,
    )
    expect(answered.session.phase).toBe('feedback')
    if (answered.session.phase === 'feedback') expect(answered.session.outcome.isCorrect).toBe(true)
  })
})
