import type { ColorSample } from '../color/types'
import type { ColorLean, PrimaryFamily, VirtualAnchorId } from '../palette/palette'

export type Skill = 'lightness' | 'chroma' | 'undertone' | 'hue' | 'temperature'
export type R1Skill = Extract<Skill, 'lightness' | 'chroma'>
export type SwatchSide = 'left' | 'right'
export type DifficultyMode = 'auto' | DifficultyBand
export type DifficultyBand = 'easy' | 'medium' | 'hard'

export interface RelativeShiftFeedbackData {
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

export interface Exercise<Question, Answer, Feedback> {
  id: string
  skill: Skill
  difficulty: DifficultyBand
  question: Question
  correctAnswer: Answer
  feedback: Feedback
}

export interface GenerationRequest {
  skill: R1Skill
  difficulty: DifficultyBand
}

export interface HiddenUndertoneGenerationRequest {
  difficulty: DifficultyBand
}

export interface HiddenUndertoneQuestion {
  prompt: string
  color: ColorSample
}

export interface HiddenUndertoneAnswer {
  family: PrimaryFamily
  lean: ColorLean
}

export interface HiddenUndertoneFeedbackData {
  anchorId: VirtualAnchorId
  anchorName: string
  explanation: string
}

export interface ExerciseGenerator<Request, Question, Answer, Feedback> {
  generate(
    input: Request,
  ): Exercise<Question, Answer, Feedback>
}

export interface DifficultyPolicy<Context, ResolvedBand extends string = DifficultyBand> {
  resolve(mode: DifficultyMode, context: Context): ResolvedBand
}

export type RelativeShiftExercise = Exercise<
  RelativeShiftQuestion,
  SwatchSide,
  RelativeShiftFeedbackData
>

export type HiddenUndertoneExercise = Exercise<
  HiddenUndertoneQuestion,
  HiddenUndertoneAnswer,
  HiddenUndertoneFeedbackData
>
