import type { Exercise } from '../domain/exercises/types'
import { QuestionGenerationError } from '../domain/exercises/generation'

export interface SessionOutcome<Answer> {
  selected: Answer
  correctAnswer: Answer
  isCorrect: boolean
}

export type FreePlaySession<Question, Answer, Feedback> =
  | {
      phase: 'question'
      exercise: Exercise<Question, Answer, Feedback>
      outcome: null
    }
  | {
      phase: 'feedback'
      exercise: Exercise<Question, Answer, Feedback>
      outcome: SessionOutcome<Answer>
    }
  | {
      phase: 'generation-error'
      message: string
    }

type QuestionFactory<Question, Answer, Feedback> = () => Exercise<Question, Answer, Feedback>

export function startSession<Question, Answer, Feedback>(
  createQuestion: QuestionFactory<Question, Answer, Feedback>,
): FreePlaySession<Question, Answer, Feedback> {
  try {
    return { phase: 'question', exercise: createQuestion(), outcome: null }
  } catch (error) {
    return {
      phase: 'generation-error',
      message: error instanceof QuestionGenerationError
        ? error.message
        : 'A new question could not be created.',
    }
  }
}

export function submitSessionAnswer<Question, Answer, Feedback, Progress>(
  session: FreePlaySession<Question, Answer, Feedback>,
  selected: Answer,
  progress: Progress,
  recordProgress: (
    progress: Progress,
    exercise: Exercise<Question, Answer, Feedback>,
    isCorrect: boolean,
  ) => Progress,
  evaluate: (selected: Answer, correct: Answer) => boolean = Object.is,
): { session: FreePlaySession<Question, Answer, Feedback>; progress: Progress } {
  if (session.phase !== 'question') return { session, progress }

  const isCorrect = evaluate(selected, session.exercise.correctAnswer)
  return {
    session: {
      phase: 'feedback',
      exercise: session.exercise,
      outcome: { selected, correctAnswer: session.exercise.correctAnswer, isCorrect },
    },
    progress: recordProgress(progress, session.exercise, isCorrect),
  }
}

export function nextSessionQuestion<Question, Answer, Feedback>(
  session: FreePlaySession<Question, Answer, Feedback>,
  createQuestion: QuestionFactory<Question, Answer, Feedback>,
): FreePlaySession<Question, Answer, Feedback> {
  if (session.phase === 'question') return session
  return startSession(createQuestion)
}
