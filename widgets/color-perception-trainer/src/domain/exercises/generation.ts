export class QuestionGenerationError extends Error {
  constructor(public readonly attempts: number) {
    super(`Unable to generate a fair display-safe question after ${attempts} attempts.`)
    this.name = 'QuestionGenerationError'
  }
}

export function generateValidated<T>(
  createCandidate: () => T,
  validate: (candidate: T) => boolean,
  maximumAttempts = 12,
): T {
  if (!Number.isInteger(maximumAttempts) || maximumAttempts < 1) {
    throw new RangeError('maximumAttempts must be a positive integer')
  }

  for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
    const candidate = createCandidate()
    if (validate(candidate)) return candidate
  }

  throw new QuestionGenerationError(maximumAttempts)
}
