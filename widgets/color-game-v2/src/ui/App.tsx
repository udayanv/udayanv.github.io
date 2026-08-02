import { useCallback, useEffect, useRef, useState } from 'react'
import { recordAnswer, recordHiddenUndertoneAnswer, setDifficultyMode, setHiddenUndertoneDifficultyMode, type ProgressSnapshot } from '../application/progress'
import { exerciseRegistry } from '../application/exerciseRegistry'
import { relativeShiftDifficultyPolicy } from '../application/relativeShiftDifficulty'
import { hiddenUndertoneDifficultyPolicy } from '../application/hiddenUndertoneDifficulty'
import { nextSessionQuestion, startSession, submitSessionAnswer, type FreePlaySession } from '../application/freePlaySession'
import { maxSrgbChroma, oklabToOklch, toDisplayColor } from '../domain/color/conversion'
import { RelativeShiftGenerator, skillLabel } from '../domain/exercises/relativeShift'
import { HiddenUndertoneGenerator } from '../domain/exercises/hiddenUndertone'
import type { DifficultyMode, HiddenUndertoneAnswer, HiddenUndertoneFeedbackData, HiddenUndertoneQuestion, RelativeShiftFeedbackData, RelativeShiftQuestion, R1Skill, SwatchSide } from '../domain/exercises/types'
import { evaluateHiddenUndertoneAnswer } from '../domain/scoring/hiddenUndertoneScoring'
import type { ColorLean, PrimaryFamily } from '../domain/palette/palette'
import { paletteDisplay } from '../domain/palette/palette'
import { BrowserRandom } from '../infrastructure/random'
import { LocalStorageProgressRepository } from '../infrastructure/progressRepository'

type ActiveSession = FreePlaySession<RelativeShiftQuestion, SwatchSide, RelativeShiftFeedbackData>
type HiddenSession = FreePlaySession<HiddenUndertoneQuestion, HiddenUndertoneAnswer, HiddenUndertoneFeedbackData>
type ActivePractice = { id: 'relative-shift'; skill: R1Skill } | { id: 'hidden-undertone' }

const generator = new RelativeShiftGenerator(new BrowserRandom())
const hiddenUndertoneGenerator = new HiddenUndertoneGenerator(new BrowserRandom())
const repository = new LocalStorageProgressRepository(window.localStorage)

function ProgressLine({ progress }: { progress: { attempted: number; correct: number } }) {
  if (progress.attempted === 0) return <span>Ready to begin</span>
  const percent = Math.round((progress.correct / progress.attempted) * 100)
  return <span>{progress.correct} of {progress.attempted} correct · {percent}%</span>
}

function HiddenProgressSummary({ progress }: { progress: ProgressSnapshot['hiddenUndertone'] }) {
  if (progress.overall.attempted === 0) return <span>Ready to begin</span>
  return (
    <span className="hidden-progress-summary">
      <ProgressLine progress={progress.overall} />
      <small>Family {progress.family.correct}/{progress.family.attempted} · Lean {progress.lean.correct}/{progress.lean.attempted}</small>
    </span>
  )
}

function PaletteReference({ open, onClose, returnFocus }: {
  open: boolean
  onClose: () => void
  returnFocus: { current: HTMLElement | null }
}) {
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) ?? []).filter((element) => !element.hasAttribute('disabled'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      returnFocus.current?.focus()
    }
  }, [open, onClose, returnFocus])

  if (!open) return null
  return (
    <div className="palette-layer">
      <button className="palette-backdrop" aria-label="Close palette reference" onClick={onClose} />
      <aside ref={panelRef} className="palette-panel" role="dialog" aria-modal="true" aria-labelledby="palette-title">
        <div className="palette-heading">
          <div>
            <p className="eyebrow">Keep nearby</p>
            <h2 id="palette-title">Palette reference</h2>
          </div>
          <button className="icon-button" onClick={onClose} autoFocus aria-label="Close palette reference">×</button>
        </div>
        <p className="palette-note">Screen references for the six DANIEL SMITH Essentials colors, based on published color measurements. Water, paper, lighting, and displays will change their appearance.</p>
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

function Home({ progress, onStartRelative, onStartHidden }: {
  progress: ProgressSnapshot
  onStartRelative: (skill: R1Skill) => void
  onStartHidden: () => void
}) {
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
            <button className="skill-choice" onClick={() => onStartRelative('lightness')}>
              <span className="choice-sample lightness-sample" aria-hidden="true"><i /><i /></span>
              <span className="choice-copy"><strong>Lightness</strong><small>Which color is lighter?</small><ProgressLine progress={progress.skills.lightness} /></span>
              <span className="arrow" aria-hidden="true">↗</span>
            </button>
            <button className="skill-choice" onClick={() => onStartRelative('chroma')}>
              <span className="choice-sample chroma-sample" aria-hidden="true"><i /><i /></span>
              <span className="choice-copy"><strong>Chroma</strong><small>Which color is more vivid?</small><ProgressLine progress={progress.skills.chroma} /></span>
              <span className="arrow" aria-hidden="true">↗</span>
            </button>
          </div>
        </article>

        <div className="future-grid" aria-label="More exercises">
          {exerciseRegistry.slice(1).map((exercise, index) => (
            <article className={`exercise-card future ${exercise.playable ? 'playable' : ''}`} key={exercise.id}>
              <div className="card-index">0{index + 2}</div>
              <div className="card-copy">
                <span className={`status ${exercise.playable ? 'available' : ''}`}>
                  {exercise.playable ? exercise.release : `Coming in ${exercise.release}`}
                </span>
                <h3>{exercise.title}</h3>
                <p>{exercise.description}</p>
                {exercise.id === 'hidden-undertone' && (
                  <button className="future-start" onClick={onStartHidden}>
                    <span>Practice Hidden Undertone</span>
                    <HiddenProgressSummary progress={progress.hiddenUndertone} />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function DifficultyControl({ mode, onChange }: {
  mode: DifficultyMode
  onChange: (mode: DifficultyMode) => void
}) {
  const choices = ['auto', 'easy', 'medium', 'hard'] as const

  const moveWithArrow = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
    if (!forward && !backward) return
    event.preventDefault()
    const nextIndex = (index + (forward ? 1 : -1) + choices.length) % choices.length
    onChange(choices[nextIndex])
    const inputs = event.currentTarget.closest('fieldset')?.querySelectorAll<HTMLInputElement>('input[type="radio"]')
    inputs?.[nextIndex]?.focus()
  }

  return (
    <fieldset className="difficulty-control">
      <legend>Difficulty</legend>
      {choices.map((choice, index) => (
        <label key={choice}>
          <input
            type="radio"
            name="difficulty"
            value={choice}
            checked={mode === choice}
            onChange={() => onChange(choice)}
            onKeyDown={(event) => moveWithArrow(event, index)}
          />
          <span>{choice[0].toUpperCase() + choice.slice(1)}</span>
        </label>
      ))}
      <small>Changes apply to the next color.</small>
    </fieldset>
  )
}

function RelativeShiftPractice({ skill, progress, onProgress, onExit, paletteOpen = false }: {
  skill: R1Skill
  progress: ProgressSnapshot
  onProgress: (progress: ProgressSnapshot) => void
  onExit: () => void
  paletteOpen?: boolean
}) {
  const makeQuestion = useCallback(() => generator.generate({
    skill,
    difficulty: relativeShiftDifficultyPolicy.resolve(
      progress.difficultyMode[skill],
      progress.skills[skill],
    ),
  }), [progress, skill])
  const [session, setSession] = useState<ActiveSession>(() => startSession(makeQuestion))

  const answer = useCallback((side: SwatchSide) => {
    const result = submitSessionAnswer(
      session,
      side,
      progress,
      (snapshot, exercise, isCorrect) => recordAnswer(
        snapshot,
        skill,
        exercise.difficulty,
        isCorrect,
      ),
    )
    if (result.session === session) return
    setSession(result.session)
    onProgress(result.progress)
  }, [onProgress, progress, session, skill])

  const next = useCallback(() => {
    setSession((current) => nextSessionQuestion(current, makeQuestion))
  }, [makeQuestion])

  const changeDifficulty = useCallback((mode: DifficultyMode) => {
    onProgress(setDifficultyMode(progress, skill, mode))
  }, [onProgress, progress, skill])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (paletteOpen) return
      if (event.key === '1') {
        event.preventDefault()
        answer('left')
      }
      if (event.key === '2') {
        event.preventDefault()
        answer('right')
      }
      if (event.key.toLowerCase() === 'n' && session.phase === 'feedback') next()
      if (event.key === 'Escape') onExit()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [answer, next, onExit, paletteOpen, session.phase])

  if (session.phase === 'generation-error') {
    return (
      <main className="practice shell">
        <div className="practice-topbar">
          <button className="text-button" onClick={onExit}>← All exercises</button>
        </div>
        <section className="generation-error" role="alert">
          <p className="eyebrow">Question unavailable</p>
          <h1>Let’s try another color.</h1>
          <p>{session.message} Your progress has not changed.</p>
          <button className="primary-button" onClick={next}>Try again</button>
        </section>
      </main>
    )
  }

  const { exercise } = session
  const outcome = session.phase === 'feedback' ? session.outcome : null

  const leftCss = toDisplayColor(exercise.question.left).css
  const rightCss = toDisplayColor(exercise.question.right).css
  const sideName = exercise.correctAnswer === 'left' ? 'left' : 'right'

  return (
    <main className="practice shell">
      <div className="practice-topbar">
        <button className="text-button" onClick={onExit}>← All exercises</button>
        <div className="session-progress"><span>{skillLabel(skill)}</span><ProgressLine progress={progress.skills[skill]} /></div>
      </div>

      <section className="question-area" aria-labelledby="question-title">
        <DifficultyControl mode={progress.difficultyMode[skill]} onChange={changeDifficulty} />
        <div className="question-heading">
          <p className="eyebrow">Relative shift · {skillLabel(skill)} · {exercise.difficulty}</p>
          <h1 id="question-title">{exercise.question.prompt}</h1>
          <p>{skill === 'lightness' ? 'Look for the color that feels closer to white.' : 'Look for the color that feels stronger and less muted.'}</p>
        </div>

        <div className="swatch-grid" aria-label="Answer choices">
          {([['left', leftCss], ['right', rightCss]] as const).map(([side, css], index) => {
            const isCorrect = Boolean(outcome) && exercise.correctAnswer === side
            const isWrong = outcome?.selected === side && !outcome.isCorrect
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

const familyLabels: Record<PrimaryFamily, string> = {
  yellow: 'Yellow',
  red: 'Red',
  blue: 'Blue',
}

const leanLabels: Record<ColorLean, string> = {
  cool: 'Cool',
  warm: 'Warm',
}

function HiddenUndertonePractice({ progress, onProgress, onExit, paletteOpen = false }: {
  progress: ProgressSnapshot
  onProgress: (progress: ProgressSnapshot) => void
  onExit: () => void
  paletteOpen?: boolean
}) {
  const makeQuestion = useCallback(() => hiddenUndertoneGenerator.generate({
    difficulty: hiddenUndertoneDifficultyPolicy.resolve(
      progress.hiddenUndertone.difficultyMode,
      progress.hiddenUndertone.overall,
    ),
  }), [progress])
  const [session, setSession] = useState<HiddenSession>(() => startSession(makeQuestion))
  const [selectedFamily, setSelectedFamily] = useState<PrimaryFamily | null>(null)

  const answerLean = useCallback((lean: ColorLean) => {
    if (!selectedFamily) return
    const selected: HiddenUndertoneAnswer = { family: selectedFamily, lean }
    const result = submitSessionAnswer(
      session,
      selected,
      progress,
      (snapshot, exercise) => recordHiddenUndertoneAnswer(
        snapshot,
        exercise.difficulty,
        evaluateHiddenUndertoneAnswer(selected, exercise.correctAnswer),
      ),
      (answer, correct) => evaluateHiddenUndertoneAnswer(answer, correct).isCorrect,
    )
    if (result.session === session) return
    setSession(result.session)
    onProgress(result.progress)
  }, [onProgress, progress, selectedFamily, session])

  const next = useCallback(() => {
    setSelectedFamily(null)
    setSession((current) => nextSessionQuestion(current, makeQuestion))
  }, [makeQuestion])

  const changeDifficulty = useCallback((mode: DifficultyMode) => {
    onProgress(setHiddenUndertoneDifficultyMode(progress, mode))
  }, [onProgress, progress])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (paletteOpen) return
      if (session.phase === 'question' && !selectedFamily) {
        const family = ({ '1': 'yellow', '2': 'red', '3': 'blue' } as const)[event.key as '1']
        if (family) {
          event.preventDefault()
          setSelectedFamily(family)
        }
      } else if (session.phase === 'question' && selectedFamily) {
        if (event.key === '1') answerLean('cool')
        if (event.key === '2') answerLean('warm')
      }
      if (event.key.toLowerCase() === 'n' && session.phase === 'feedback') next()
      if (event.key === 'Escape') onExit()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [answerLean, next, onExit, paletteOpen, selectedFamily, session.phase])

  if (session.phase === 'generation-error') {
    return (
      <main className="practice shell">
        <div className="practice-topbar"><button className="text-button" onClick={onExit}>← All exercises</button></div>
        <section className="generation-error" role="alert">
          <p className="eyebrow">Question unavailable</p>
          <h1>Let’s try another color.</h1>
          <p>{session.message} Your progress has not changed.</p>
          <button className="primary-button" onClick={next}>Try again</button>
        </section>
      </main>
    )
  }

  const { exercise } = session
  const outcome = session.phase === 'feedback' ? session.outcome : null
  const stageOutcome = outcome
    ? evaluateHiddenUndertoneAnswer(outcome.selected, outcome.correctAnswer)
    : null
  const displayColor = toDisplayColor(exercise.question.color)
  const lch = oklabToOklch(displayColor.sample)
  const normalizedChroma = lch.C / maxSrgbChroma(lch.L, lch.h)

  return (
    <main className="practice hidden-practice shell">
      <div className="practice-topbar">
        <button className="text-button" onClick={onExit}>← All exercises</button>
        <div className="session-progress"><span>Hidden Undertone</span><ProgressLine progress={progress.hiddenUndertone.overall} /></div>
      </div>

      <section className="question-area" aria-labelledby="question-title">
        <DifficultyControl mode={progress.hiddenUndertone.difficultyMode} onChange={changeDifficulty} />
        <div className="question-heading">
          <p className="eyebrow">Hidden undertone · {exercise.difficulty} · {outcome ? 'Complete' : `Step ${selectedFamily ? '2' : '1'} of 2`}</p>
          <h1 id="question-title">{exercise.question.prompt}</h1>
          <p>Start with the broad color family. Then notice whether it leans cool or warm.</p>
        </div>

        <div className="undertone-sample" style={{ background: displayColor.css }} aria-label="Muted color sample" />

        {!outcome && !selectedFamily && (
          <fieldset className="undertone-choices">
            <legend>First, choose the color family</legend>
            {(Object.keys(familyLabels) as PrimaryFamily[]).map((family, index) => (
              <button key={family} onClick={() => setSelectedFamily(family)}>
                <kbd>{index + 1}</kbd><strong>{familyLabels[family]}</strong>
              </button>
            ))}
          </fieldset>
        )}

        {!outcome && selectedFamily && (
          <fieldset className="undertone-choices lean-choices">
            <legend>Now, which way does the {familyLabels[selectedFamily].toLowerCase()} lean?</legend>
            {(Object.keys(leanLabels) as ColorLean[]).map((lean, index) => (
              <button key={lean} onClick={() => answerLean(lean)}>
                <kbd>{index + 1}</kbd><strong>{leanLabels[lean]}</strong>
              </button>
            ))}
            <button className="stage-back" onClick={() => setSelectedFamily(null)}>← Change family</button>
          </fieldset>
        )}

        <div className="feedback-slot" aria-live="polite">
          {outcome && stageOutcome ? (
            <div className={`feedback undertone-feedback ${stageOutcome.isCorrect ? 'positive' : 'gentle'}`}>
              <div>
                <p className="feedback-result">{stageOutcome.isCorrect ? 'Yes—that’s the anchor.' : `This one follows ${exercise.feedback.anchorName}.`}</p>
                <div className="stage-results">
                  <span className={stageOutcome.familyCorrect ? 'stage-correct' : 'stage-wrong'}>
                    Family: {familyLabels[outcome.selected.family]} {stageOutcome.familyCorrect ? '✓' : `→ ${familyLabels[outcome.correctAnswer.family]}`}
                  </span>
                  <span className={stageOutcome.leanCorrect ? 'stage-correct' : 'stage-wrong'}>
                    Lean: {leanLabels[outcome.selected.lean]} {stageOutcome.leanCorrect ? '✓' : `→ ${leanLabels[outcome.correctAnswer.lean]}`}
                  </span>
                </div>
                <p><strong>{exercise.feedback.anchorName}</strong> is the defined answer. {exercise.feedback.explanation}</p>
                <details>
                  <summary>See the measured color</summary>
                  <p>Chroma: {lch.C.toFixed(3)} · normalized chroma: {normalizedChroma.toFixed(3)}</p>
                </details>
              </div>
              <button className="primary-button" onClick={next}>Next color <span aria-hidden="true">→</span></button>
            </div>
          ) : !selectedFamily ? (
            <p className="keyboard-hint">Choose a family, or press <kbd>1</kbd>, <kbd>2</kbd>, or <kbd>3</kbd>.</p>
          ) : (
            <p className="keyboard-hint">Choose a lean, or press <kbd>1</kbd> / <kbd>2</kbd>.</p>
          )}
        </div>
      </section>
    </main>
  )
}

export function App() {
  const [progress, setProgress] = useState(() => repository.load())
  const [activePractice, setActivePractice] = useState<ActivePractice | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const paletteReturnFocus = useRef<HTMLElement | null>(null)

  const openPalette = useCallback(() => {
    paletteReturnFocus.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    setPaletteOpen(true)
  }, [])

  const updateProgress = useCallback((next: ProgressSnapshot) => {
    setProgress(next)
    repository.save(next)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [activePractice])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      if (event.key.toLowerCase() === 'p') {
        if (paletteOpen) setPaletteOpen(false)
        else openPalette()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openPalette, paletteOpen])

  return (
    <>
      <div className="app-content" inert={paletteOpen ? true : undefined} aria-hidden={paletteOpen || undefined}>
        <header className="site-header shell">
          <button className="brand" onClick={() => setActivePractice(null)} aria-label="Color Perception Trainer home">
            <span className="brand-dot" aria-hidden="true" />
            <span>Color<br />Perception</span>
          </button>
          <button className="palette-button" onClick={openPalette} aria-haspopup="dialog">
            <span className="mini-swatches" aria-hidden="true"><i /><i /><i /></span>
            Palette reference
            <kbd>P</kbd>
          </button>
        </header>
        {activePractice?.id === 'relative-shift' && (
          <RelativeShiftPractice skill={activePractice.skill} progress={progress} onProgress={updateProgress} onExit={() => setActivePractice(null)} paletteOpen={paletteOpen} />
        )}
        {activePractice?.id === 'hidden-undertone' && (
          <HiddenUndertonePractice progress={progress} onProgress={updateProgress} onExit={() => setActivePractice(null)} paletteOpen={paletteOpen} />
        )}
        {!activePractice && (
          <Home
            progress={progress}
            onStartRelative={(skill) => setActivePractice({ id: 'relative-shift', skill })}
            onStartHidden={() => setActivePractice({ id: 'hidden-undertone' })}
          />
        )}
      </div>
      <PaletteReference open={paletteOpen} onClose={() => setPaletteOpen(false)} returnFocus={paletteReturnFocus} />
    </>
  )
}
