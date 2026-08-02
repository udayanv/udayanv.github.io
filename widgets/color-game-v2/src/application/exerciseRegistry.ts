export interface ExerciseListing {
  id: 'relative-shift' | 'hidden-undertone' | 'mix-a-color'
  title: string
  description: string
  release: 'Available now' | 'R2' | 'R3'
  playable: boolean
}

export const exerciseRegistry: ExerciseListing[] = [
  {
    id: 'relative-shift',
    title: 'Relative Shift',
    description: 'Compare two colors and spot one clear difference.',
    release: 'Available now',
    playable: true,
  },
  {
    id: 'hidden-undertone',
    title: 'Hidden Undertone',
    description: 'Find the color family beneath a muted color.',
    release: 'Available now',
    playable: true,
  },
  {
    id: 'mix-a-color',
    title: 'Mix a Color',
    description: 'Identify the virtual primary added to make a new color.',
    release: 'R3',
    playable: false,
  },
]
