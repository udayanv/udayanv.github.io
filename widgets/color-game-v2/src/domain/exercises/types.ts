import type { ColorSample } from '../color/types'

export type Skill = 'lightness' | 'chroma' | 'hue' | 'temperature'
export type R1Skill = Extract<Skill, 'lightness' | 'chroma'>
export type SwatchSide = 'left' | 'right'

export interface FeedbackData {
  skill: R1Skill
  correctSide: SwatchSide
  direction: 'lighter' | 'more vivid'
  explanation: string
}

export interface RelativeShiftQuestion {
  prompt: string
  left: ColorSample
  right: ColorSample
}

export interface Exercise<Question, Answer> {
  id: string
  skill: Skill
  difficulty: number
  question: Question
  correctAnswer: Answer
  feedback: FeedbackData
}

export interface GenerationRequest {
  skill: R1Skill
  difficulty: number
}

export interface ExerciseGenerator {
  generate(
    input: GenerationRequest,
  ): Exercise<RelativeShiftQuestion, SwatchSide>
}
