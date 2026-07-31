import { useCallback, useEffect, useMemo, useState } from 'react'
import { difficultyFor, recordAnswer, type ProgressSnapshot } from '../application/progress'
import { exerciseRegistry } from '../application/exerciseRegistry'
import { toDisplayColor } from '../domain/color/conversion'
import { RelativeShiftGenerator, skillLabel } from '../domain/exercises/relativeShift'
import type { Exercise, RelativeShiftQuestion, R1Skill, SwatchSide } from '../domain/exercises/types'
import { evaluateAnswer, type AnswerOutcome } from '../domain/scoring/scoring'
import { paletteDisplay } from '../domain/palette/palette'
import { BrowserRandom } from '../infrastructure/random'
import { LocalStorageProgressRepository } from '../infrastructure/progressRepository'

type ActiveExercise = Exercise<RelativeShiftQuestion, SwatchSide>

const generator = new RelativeShiftGenerator(new BrowserRandom())
const repository = new LocalStorageProgressRepository(window.localStorage)

function ProgressLine({ progress }: { progress: { attempted: number; correct: number } }) {
  if (progress.attempted === 0) return <span>Ready to begin</span>
  const percent = Math.round((progress.correct / progress.attempted) * 100)
  return <span>{progress.correct} of {progress.attempted} correct · {percent}%</span>
}

function PaletteReference({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="palette-layer">
      <button className="palette-backdrop" aria-label="Close palette reference" onClick={onClose} />
      <aside className="palette-panel" role="dialog" aria-modal="true" aria-labelledby="palette-title">
        <div className="palette-heading">
          <div>
            <p className="eyebrow">Keep nearby</p>
            <h2 id="palette-title">Palette reference</h2>
          </div>
          <button className="icon-button" onClick={onClose} autoFocus aria-label="Close palette reference">×</button>
        </div>
        <p className="palette-note">Six learning anchors for comparing color families—not exact commercial paints or a required physical palette.</p>
        <div className="palette-grid">
          {paletteDisplay.map((anchor) => (
            <div className="palette-item" key={anchor.id}>
              <span className="palette-swatch" style={{ background: anchor.css }} aria-hidden="true" />
              <span>{anchor.name}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}

function Home({ progress, onStart }: { progress: ProgressSnapshot; onStart: (skill: R1Skill) => void }) {
  const current = exerciseRegistry[0]
  return (
    <main className="home shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A quiet practice for sharper seeing</p>
          <h1>Learn to see what color is doing.</h1>
          <p className="hero-lede">Compare two colors at a time. Build your eye for the differences painters use every day—no theory background needed.</p>
        </div>
        <div className="hero-mark" aria-hidden="true">
          <span /><span /><span />
        </div>
      </section>

      <section className="selector" aria-labelledby="practice-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Free play</p>
            <h2 id="practice-title">Choose what to notice</h2>
          </div>
          <p>There’s no timer and no finish line. Practice for as long as you like.</p>
        </div>

        <article className="exercise-card featured">
          <div className="card-index">01</div>
          <div className="card-copy">
            <span className="status available">{current.release}</span>
            <h3>{current.title}</h3>
            <p>{current.description}</p>
          </div>
          <div className="skill-choices">
            <button className="skill-choice" onClick={() => onStart('lightness')}>
              <span className="choice-sample lightness-sample" aria-hidden="true"><i /><i /></span>
              <span className="choice-copy"><strong>Lightness</strong><small>Which color is lighter?</small><ProgressLine progress={progress.skills.lightness} /></span>
              <span className="arrow" aria-hidden="true">↗</span>
            </button>
            <button className="skill-choice" onClick={() => onStart('chroma')}>
              <span className="choice-sample chroma-sample" aria-hidden="true"><i /><i /></span>
              <span className="choice-copy"><strong>Chroma</strong><small>Which color is more vivid?</small><ProgressLine progress={progress.skills.chroma} /></span>
              <span className="arrow" aria-hidden="true">↗</span>
            </button>
          </div>
        </article>

        <div className="future-grid" aria-label="Future exercises">
          {exerciseRegistry.slice(1).map((exercise, index) => (
            <article className="exercise-card future" key={exercise.id}>
              <div className="card-index">0{index + 2}</div>
              <div className="card-copy">
                <span className="status">Coming in {exercise.release}</span>
                <h3>{exercise.title}</h3>
                <p>{exercise.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function Practice({ skill, progress, onProgress, onExit, paletteOpen = false }: {
  skill: R1Skill
  progress: ProgressSnapshot
  onProgress: (progress: ProgressSnapshot) => void
  onExit: () => void
  paletteOpen?: boolean
}) {
  const makeQuestion = useCallback(
    () => generator.generate({ skill, difficulty: difficultyFor(progress.skills[skill]) }),
    [progress, skill],
  )
  const [exercise, setExercise] = useState<ActiveExercise>(makeQuestion)
  const [outcome, setOutcome] = useState<AnswerOutcome | null>(null)

  const answer = useCallback((side: SwatchSide) => {
    if (outcome) return
    const result = evaluateAnswer(side, exercise.correctAnswer)
    setOutcome(result)
    onProgress(recordAnswer(progress, skill, result.isCorrect))
  }, [exercise, onProgress, outcome, progress, skill])

  const next = useCallback(() => {
    setExercise(makeQuestion())
    setOutcome(null)
  }, [makeQuestion])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (paletteOpen) return
      if (event.key === '1' || event.key === 'ArrowLeft') {
        event.preventDefault()
        answer('left')
      }
      if (event.key === '2' || event.key === 'ArrowRight') {
        event.preventDefault()
        answer('right')
      }
      if (event.key.toLowerCase() === 'n' && outcome) next()
      if (event.key === 'Escape') onExit()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [answer, next, onExit, outcome, paletteOpen])

  const leftCss = useMemo(() => toDisplayColor(exercise.question.left).css, [exercise])
  const rightCss = useMemo(() => toDisplayColor(exercise.question.right).css, [exercise])
  const sideName = exercise.correctAnswer === 'left' ? 'left' : 'right'

  return (
    <main className="practice shell">
      <div className="practice-topbar">
        <button className="text-button" onClick={onExit}>← All exercises</button>
        <div className="session-progress"><span>{skillLabel(skill)}</span><ProgressLine progress={progress.skills[skill]} /></div>
      </div>

      <section className="question-area" aria-labelledby="question-title">
        <div className="question-heading">
          <p className="eyebrow">Relative shift · {skillLabel(skill)}</p>
          <h1 id="question-title">{exercise.question.prompt}</h1>
          <p>{skill === 'lightness' ? 'Look for the color that feels closer to white.' : 'Look for the color that feels stronger and less muted.'}</p>
        </div>

        <div className="swatch-grid" aria-label="Answer choices">
          {([['left', leftCss], ['right', rightCss]] as const).map(([side, css], index) => {
            const isCorrect = outcome && exercise.correctAnswer === side
            const isWrong = outcome && outcome.selected === side && !outcome.isCorrect
            return (
              <button
                key={side}
                className={`answer-swatch ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                onClick={() => answer(side)}
                disabled={Boolean(outcome)}
                aria-label={`${side} color, answer ${index + 1}`}
              >
                <span className="color-field" style={{ background: css }} />
                <span className="swatch-label"><kbd>{index + 1}</kbd> {side}</span>
              </button>
            )
          })}
        </div>

        <div className="feedback-slot" aria-live="polite">
          {outcome ? (
            <div className={`feedback ${outcome.isCorrect ? 'positive' : 'gentle'}`}>
              <div>
                <p className="feedback-result">{outcome.isCorrect ? 'Yes—that’s it.' : 'Not quite. Take another look.'}</p>
                <p>The <strong>{sideName} color</strong> is {exercise.feedback.direction}. {exercise.feedback.explanation}</p>
                <details>
                  <summary>See the measured difference</summary>
                  <p>{skill === 'lightness'
                    ? `Lightness: ${exercise.question.left.L.toFixed(3)} left · ${exercise.question.right.L.toFixed(3)} right`
                    : `Chroma: ${Math.hypot(exercise.question.left.a, exercise.question.left.b).toFixed(3)} left · ${Math.hypot(exercise.question.right.a, exercise.question.right.b).toFixed(3)} right`}</p>
                </details>
              </div>
              <button className="primary-button" onClick={next}>Next color <span aria-hidden="true">→</span></button>
            </div>
          ) : <p className="keyboard-hint">Choose a swatch, or press <kbd>1</kbd> / <kbd>2</kbd>.</p>}
        </div>
      </section>
    </main>
  )
}

export function App() {
  const [progress, setProgress] = useState(() => repository.load())
  const [skill, setSkill] = useState<R1Skill | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)

  const updateProgress = useCallback((next: ProgressSnapshot) => {
    setProgress(next)
    repository.save(next)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'p') setPaletteOpen((value) => !value)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <header className="site-header shell">
        <button className="brand" onClick={() => setSkill(null)} aria-label="Color Perception Trainer home">
          <span className="brand-dot" aria-hidden="true" />
          <span>Color<br />Perception</span>
        </button>
        <button className="palette-button" onClick={() => setPaletteOpen(true)} aria-haspopup="dialog">
          <span className="mini-swatches" aria-hidden="true"><i /><i /><i /></span>
          Palette reference
          <kbd>P</kbd>
        </button>
      </header>
      {skill
        ? <Practice skill={skill} progress={progress} onProgress={updateProgress} onExit={() => setSkill(null)} paletteOpen={paletteOpen} />
        : <Home progress={progress} onStart={setSkill} />}
      <PaletteReference open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  )
}
