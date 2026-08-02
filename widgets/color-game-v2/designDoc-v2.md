# Color Perception Trainer — Project Plan

> This is the active design and implementation plan. Preserve `designDoc.md` unchanged as the original reference.

## 1. Project Summary

Color Perception Trainer is a browser-based learning tool for novice painters and beginners with little formal art background. It teaches users to see color as measurable relationships—especially lightness and chroma—rather than relying on broad color names.

The application is a static, browser-only React app. Its initial release is a free-play comparison exercise. Users select a skill, answer one procedural color question at a time, receive a clear explanation, and can continue or leave whenever they choose.

The product must be modular and scalable: new exercises, color models, palettes, and persistence methods should extend defined interfaces rather than require a rewrite.

## 2. Audience and Learning Approach

### Primary audience

Beginners and novice watercolor painters who want to improve visual color judgment but may not know formal color-theory vocabulary.

### Learning principles

1. Teach one perceptual relationship at a time.
2. Use plain language before formal vocabulary: “lighter” before “lightness,” and “more vivid” before “chroma.”
3. Give immediate feedback that explains the relationship, not merely whether the answer was correct.
4. Keep user control high: free play, no required lesson sequence, and no mandatory session length.
5. Keep pigment interpretation separate from perceptual scoring.

## 3. Initial Release (R1)

### R1 goal

Deliver a polished, reliable free-play experience for comparing colors by **Lightness** or **Chroma**.

### Included

- React, TypeScript, Vite, browser-only deployment suitable for GitHub Pages.
- A home/exercise-selection screen.
- Relative Shift: the only playable R1 exercise.
- Separate selectable practice choices for Lightness and Chroma.
- Procedurally generated questions with objective answers.
- Immediate feedback after every answer.
- An optional, always-available Palette Reference for the six preset primaries.
- LocalStorage persistence of basic performance separately by skill.
- Responsive, accessible controls for desktop and mobile.

### Excluded from R1

- Hidden Undertone and Mix a Color exercises (reserved for future releases).
- Hue and temperature questions.
- Physical/spectral watercolor simulation.
- Measured commercial-pigment palettes.
- Image uploads, accounts, cloud sync, social features, streaks, or notifications.
- Full adaptive-learning algorithms, confusion maps, reaction-time analytics, and backend services.

### R1 release criteria

R1 is ready to share when a beginner can:

1. Choose Lightness or Chroma without needing prior art vocabulary.
2. Understand how to answer and receive feedback after one question.
3. Continue practicing or return to the selector at any time.
4. Return later and see their locally saved results by skill.
5. Use the experience with keyboard or touch controls on a typical desktop or mobile browser.

## 4. User Experience

### Home and exercise selection

The home screen presents a simple selector. R1 has one playable card:

- **Relative Shift** — “Compare two colors and spot one clear difference.”

Within that exercise, show two selectable choices:

- **Lightness** — “Which color is lighter?”
- **Chroma** — “Which color is more vivid?”

Reserve explicit, data-driven positions for future cards:

- **Hidden Undertone** — “Find the color family beneath a muted color.” (R2)
- **Mix a Color** — “Identify the virtual primary added to make a new color.” (R3)

The future cards may be shown as “Coming soon” if their short descriptions are helpful; otherwise retain them in the exercise registry until playable.

### Free-play loop

1. User selects Relative Shift and a skill.
2. App shows two color swatches and one direct question.
3. User selects a swatch as their answer.
4. App shows correct/incorrect feedback and a short explanation.
5. User chooses “Next color” or returns to the selector.

There is no fixed question count, required completion, or forced summary. A lightweight summary can be offered on exit.

### Difficulty controls

Every playable exercise exposes four shared user-facing choices: **Auto**, **Easy**, **Medium**, and **Hard**. These names describe modes, not universal numeric generation rules. Each exercise owns a difficulty policy that defines what its bands mean, how Auto advances, and which post-generation validation thresholds apply. Auto is the beginner-friendly default and selects a bounded band from the learner's progress in that exercise. A manual choice overrides Auto until the learner changes it; changing difficulty affects the next question, never the question already on screen.

Difficulty is an exercise-specific policy rather than a single global numeric delta. Each policy must define measurable generation ranges and validate the final display-safe question. Hard means a smaller but still clearly discernible difference, not an intentionally ambiguous or trick question. The UI presents the choices as an accessible radio group with arrow-key support and touch targets of at least 44 by 44 CSS pixels.

Progress records the resolved band actually played and retains an overall total plus per-band totals. The selected mode is stored separately and may be shared across sessions, but performance for one exercise must not automatically raise the difficulty of a different exercise. Implementations must not expose a single global numeric `difficulty` whose meaning leaks across exercise boundaries.

### Feedback

Feedback must be concise and educational. Examples:

- Lightness: “The left color is lighter. Lightness describes how close a color is to white or black.”
- Chroma: “The right color is more vivid. Chroma describes how strong or muted a color appears.”

For R1, show the tested dimension and the direction of the difference. Technical OKLCH values may appear in an optional details area, not as the primary explanation.

### Palette Reference

Provide an always-available palette button. It opens a pop-out sheet on small screens and may be a collapsible side panel on large screens. It shows a screen-reference swatch and label for the six colors in the DANIEL SMITH Essentials Watercolor Set:

- Hansa Yellow Light (cool yellow)
- New Gamboge (warm yellow)
- Quinacridone Rose (cool red)
- Pyrrol Scarlet (warm red)
- Phthalo Blue, Green Shade (cool blue)
- French Ultramarine Blue (warm blue)

State clearly that these are conservative screen approximations derived from the manufacturer's published CIE Lab measurements, not color-managed reproductions of watercolor on paper. Dilution, paper, lighting, and display conditions change appearance. The reference never reveals answers or affects scoring.

## 5. Color Model and Exercise Rules

### Canonical representation

Store and calculate colors internally only as OKLab:

```ts
interface ColorSample {
  L: number;
  a: number;
  b: number;
}
```

Convert temporarily to OKLCH only when a hue/chroma representation is useful for generation, explanations, or debugging. Do not store both representations.

### Why OKLab

OKLab provides a perceptually oriented Cartesian space. Euclidean distance, interpolation, and bounded changes are straightforward. It also avoids hue-angle wrapping in core calculations.

### Display and gamut policy

The app must render conservatively in sRGB, the common display baseline. Generate candidate colors within a deliberately safe sRGB display range; if conversion produces an out-of-gamut color, reduce chroma while preserving lightness and hue as closely as possible. Reject and regenerate a sample if the remaining visible difference is too small.

This policy prioritizes fair, clear questions across ordinary screens over maximum color saturation. Gamut handling belongs in a dedicated color-rendering module so it can be improved later without changing exercise logic.

### Virtual palette

Define the following six virtual anchors as OKLCH values, convert them once to OKLab during initialization, and retain only the OKLab values for calculations.

| Anchor | L | C | H |
|---|---:|---:|---:|
| Hansa Yellow Light | 0.92121 | 0.19657 | 107.37734° |
| New Gamboge | 0.86354 | 0.16515 | 88.08280° |
| Quinacridone Rose | 0.68129 | 0.15715 | 356.65572° |
| Pyrrol Scarlet | 0.60269 | 0.19750 | 28.88184° |
| Phthalo Blue (Green Shade) | 0.57809 | 0.12321 | 235.33881° |
| French Ultramarine Blue | 0.59035 | 0.16458 | 262.41026° |

### Relative Shift rules

Each R1 question tests exactly one perceptual dimension. Do not combine changes in a single question.

| Skill | Prompt | Generation rule | Recorded skill |
|---|---|---|---|
| Lightness | “Which color is lighter?” | Adjust OKLab `L`; retain the same chromatic direction. | `lightness` |
| Chroma | “Which color is more vivid?” | Adjust OKLCH `C` (the magnitude of the OKLab `a`/`b` vector); retain `L` and hue. | `chroma` |

Use bounded difficulty bands. Easier questions have visibly larger differences; later bands reduce the difference only when it remains clearly discernible after gamut mapping. Randomize left/right answer placement.

The shared difficulty choices map to the existing Relative Shift bands as follows:

| Band | Lightness difference | Chroma difference |
|---|---:|---:|
| Easy | 0.140 | 0.080 |
| Medium | 0.100 | 0.060 |
| Hard | 0.075 | 0.045 |

Auto begins at Easy, may move to Medium after at least 5 attempts with at least 60% correct, and may move to Hard after at least 15 attempts with at least 70% correct. These thresholds are evaluated separately for Lightness and Chroma. Manual selection bypasses advancement rules but never bypasses gamut or minimum-distinction validation.

## 6. Modular Architecture

```text
domain/color       OKLab math, conversions, gamut-safe rendering
domain/palette     Virtual anchor definitions and palette data
domain/exercises   Exercise definitions, generation, prompts, answer keys, feedback data
domain/scoring     Answer evaluation and skill-level outcomes
application        Free-play orchestration and future selection/adaptation policy
infrastructure     Randomness, LocalStorage, future persistence adapters
ui                 React components and presentation-only formatting
```

Dependencies flow inward: UI and infrastructure may depend on domain modules; domain modules must not depend on React, LocalStorage, or browser APIs.

### Core contracts

```ts
type Skill = 'lightness' | 'chroma' | 'hue' | 'temperature';

interface Exercise<Question, Answer> {
  id: string;
  skill: Skill;
  difficulty: number;
  question: Question;
  correctAnswer: Answer;
  feedback: FeedbackData;
}

interface ExerciseGenerator {
  generate(input: GenerationRequest): Exercise<unknown, unknown>;
}

interface ProgressRepository {
  load(): ProgressSnapshot;
  save(snapshot: ProgressSnapshot): void;
}
```

Generators create question data and answer keys. Scoring evaluates a submitted answer. UI renders data and dispatches user intent. LocalStorage is one `ProgressRepository` implementation, not a domain dependency.

### Suggested initial implementation order

1. Scaffold the Vite React/TypeScript app and define the domain types.
2. Build and test OKLab/OKLCH conversion, sRGB gamut mapping, and color serialization.
3. Implement Relative Shift generators for Lightness and Chroma, including deterministic seeded randomness for development/testing.
4. Implement answer evaluation, feedback data, and aggregate progress by skill.
5. Build the selector, free-play question view, feedback view, and palette pop-out.
6. Add LocalStorage persistence, keyboard navigation, touch-friendly controls, and responsive styling.
7. Test edge cases: gamut, random answer placement, persistence failure, keyboard-only use, narrow screens, and clear distinction at every R1 difficulty band.

### Architecture plan before R2 and R3

The next exercises should be added only after the shared exercise boundaries are made genuinely reusable. Changes that affect dependency direction, orchestration, generator fairness, or the common exercise contract become more expensive once multiple exercise implementations depend on the current R1 shape.

| Timing | Improvement | Reason |
|---|---|---|
| Before R2 or R3 | Move `RandomSource` and `ProgressRepository` contracts to domain/application ports; keep browser randomness and LocalStorage implementations in infrastructure. | Prevents new domain generators and application services from depending outward on infrastructure. |
| Before R2 or R3 | Extract a framework-independent free-play session service or reducer from React. | Gives every exercise the same lifecycle for question creation, answer submission, feedback, progress updates, and moving to the next question. |
| Before R2 or R3 | Generalize the exercise-generator and answer contracts without erasing their question and answer types. | Hidden Undertone and Mix a Color require different question data and answer choices from Relative Shift. |
| Before R2 or R3 | Add post-gamut question validation with per-exercise minimum-difference policies, bounded regeneration attempts, and explicit failure handling. | Every exercise must remain objectively fair after display conversion rather than merely at its initially generated values. |
| Before R2 or R3 | Add unit tests for shared ports, session transitions, generator invariants, palette order, and every existing difficulty band. | Locks in R1 behavior before shared code is reused and extended. |
| During each exercise | Define its operational scoring rules, generation range, feedback vocabulary, and progress category before building its UI. | Keeps interpretations separate from measurable answer keys and avoids UI-driven domain rules. |
| After R2/R3 domain foundations | Split the current React file into screen components and reusable presentation components. | This improves maintainability but does not determine domain correctness; perform the split before adding substantial exercise-specific UI. |
| After exercise integration, before release | Complete dialog focus trapping/restoration, background inertness, scroll locking, and keyboard interaction tests. | These are release-quality accessibility requirements but do not need to block early domain work. |
| After exercise integration, before release | Add end-to-end coverage for exercise selection, persistence, keyboard-only play, and narrow-screen layouts. | End-to-end tests are most useful once the new user flows have stabilized. |

#### Sequenced next steps

1. Restore a reproducible local toolchain and run the current R1 tests and production build to establish a clean baseline.
2. Introduce inward-facing ports for randomness and progress persistence, then update the existing adapters without changing behavior.
3. Extract and unit-test the free-play session lifecycle from React.
4. Generalize the exercise registration, generation, answer, feedback, difficulty-policy, and progress contracts while retaining compile-time types for each exercise; add the shared Auto/Easy/Medium/Hard control and persist the selected mode.
5. Implement a reusable validation pipeline that evaluates final display-safe colors, retries invalid questions up to a fixed limit, and reports generation failure safely.
6. Expand R1 tests to cover all difficulty bands, minimum visible differences, randomized answer placement, palette ordering, and session transitions.
7. Specify and implement R2 Hidden Undertone against the shared contracts; keep contextual interpretation outside objective scoring.
8. Specify a replaceable mixing-model interface and implement R3 Mix a Color against the same session, scoring, and persistence boundaries.
9. Split exercise-specific React screens from shared controls, then complete accessibility and end-to-end validation before either exercise is released.

## 7. Future Releases

| Release | Purpose | Scope | Exit condition |
|---|---|---|---|
| R1 | Establish reliable beginner practice | Relative Shift: Lightness and Chroma, free play, feedback, palette reference, local progress | Meets the R1 release criteria. |
| R1.1 | Learning polish | Refine difficulty policies, clearer explanations, basic weak-skill weighting, accessibility refinement | Learners can find and repeat weak areas easily. |
| R2: Hidden Undertone | Teach color-family bias beneath muted colors | Define a reproducible muted-color range; dominant-family and warm/cool prompts; optional interpretation feedback | Interpretations are explanatory only and never define scoring. |
| R3: Mix a Color | Teach perceptual transformation | Source/result questions generated by adding a known virtual anchor at a known ratio | Uses existing exercise, scoring, and feedback contracts. |
| R4 | Improve realism and palette options | Measured pigment data, multiple virtual palettes, replaceable physical/spectral mixing adapter | New palette/model adapters do not alter the perceptual core. |
| R5 | Expand learning sources | Image sampling, richer history, optional sync/backend | Additional inputs use the same color and exercise domain contracts. |

### R2: Hidden Undertone

Show a deliberately muted color. Ask the user to identify the dominant primary family and then warm/cool lean. Define the muted generation range and the operational scoring definition before implementation; “warm” and “cool” are contextual and cannot be assessed casually. Nearest-pigment results, if shown, are interpretations—not perceptual truth.

#### Operational definition of neutral

The mathematical neutral axis is OKLab `a = 0` and `b = 0`, equivalent to OKLCH `C = 0`. For display and scoring, R2 uses the following explicit terms after gamut mapping:

- **Operationally neutral:** `C <= 0.015`. Hue is treated as undefined and no undertone answer is scored.
- **Muted or near-neutral:** `C > 0.015`, with chroma low enough to fall inside the exercise ranges below. Hue remains defined by the generated OKLab `a`/`b` direction.

R2 questions are generated by starting at a neutral gray of the target lightness and moving along the OKLab chromatic direction of exactly one virtual anchor. The anchor used by generation is the objective answer. R2 does not infer perceptual truth from the nearest named pigment, and it does not include trick "neutral" answers in the initial release. Samples at or below the operational-neutral threshold are rejected and regenerated.

To keep difficulty comparable across lightnesses and hues, use normalized chroma `r = C / Cmax(L, h)`, where `Cmax` is the maximum display-safe sRGB chroma at the generated lightness and hue. Initial R2 bands are:

| Band | Normalized chroma `r` | Additional rule |
|---|---:|---|
| Easy | 0.30-0.40 | Strongly muted but readily identifiable. |
| Medium | 0.20-0.30 | Quieter undertone with the same two-stage family and warm/cool answer. |
| Hard | 0.12-0.20 | Must still have final `C >= 0.025` and pass display-distinction validation. |

All bands use the same two-stage task: identify Yellow, Red, or Blue, then identify the warm or cool lean. The two selections form one six-anchor answer. Family and warm/cool stages are scored separately for diagnostic progress, while the whole question is correct only when both stages are correct. Feedback names the generated anchor and explains that the answer follows the app's defined learning anchors. Future neutral-detection questions, if added, must be a separate question type with their own scoring and calibration.

R2 stores overall, family-stage, and warm/cool-stage performance, including per-band totals. Auto uses overall question performance only: it begins at Easy, may move to Medium after at least 5 attempts with at least 60% correct, and may move to Hard after at least 15 attempts with at least 70% correct. These thresholds belong to the Hidden Undertone difficulty policy and may be recalibrated without changing Relative Shift.

### R3: Mix a Color

Show a source color and a result created by adding a known proportion of one virtual anchor using the current perceptual interpolation model. Ask which anchor was added. Start with large, clear mix ratios and lower them gradually. Keep the mix model behind an interface so it can later be replaced by a physical watercolor model.

R3 difficulty controls both the added-anchor proportion and the similarity of the answer choices:

| Band | Added-anchor proportion | Answer choices |
|---|---:|---|
| Easy | 0.35-0.45 | Three choices drawn from different primary families. |
| Medium | 0.22-0.35 | Six virtual anchors, with clearly separated generated results. |
| Hard | 0.12-0.22 | Six virtual anchors including the paired warm/cool distractor; reject ambiguous results. |

The final source/result pair and every distractor prediction must be evaluated after gamut mapping. A question is regenerated when the intended result is below the minimum visible change from the source or insufficiently separated from a distractor. Auto may advance only through bands that have passed these checks.

## 8. Non-goals and Risks

### Non-goals for the perceptual core

- It is not a physically accurate watercolor simulator.
- It does not claim virtual anchors correspond exactly to named commercial pigments.
- It does not treat warm/cool interpretation as a substitute for measurable color relationships.

### Risks to manage

- Displays and browsers differ. Use conservative sRGB rendering and sufficiently large R1 differences.
- Beginner terminology can overwhelm learners. Keep formal terms contextual and optional.
- Pigment explanations can overstate certainty. Label them as estimates whenever introduced.

## 9. Change Log

- 2026-08-01 — Defined R2 as a two-stage family/lean interaction with separate stage progress, combined question correctness, and an independent Auto policy.
- 2026-08-01 — Defined operational neutrality and initial R2/R3 difficulty bands; added shared Auto/Easy/Medium/Hard controls and progress requirements.
- 2026-08-01 — Added a sequenced architecture plan separating prerequisites for R2/R3 from improvements that can follow exercise-domain work.
- 2026-08-01 — Standardized Palette Reference ordering so each color family is shown cool first, then warm.
- 2026-07-31 — Created the active project plan; preserved `designDoc.md` as the unchanged reference.
- 2026-07-31 — Set the primary audience to beginners and added the six-primary Palette Reference.
- 2026-07-31 — Selected free play and a modular exercise-selection screen.
- 2026-07-31 — Locked R1 to Relative Shift, reserving Hidden Undertone (R2) and Mix a Color (R3).
- 2026-07-31 — Set Lightness and Chroma as separate R1 choices with independent generation and progress tracking.
