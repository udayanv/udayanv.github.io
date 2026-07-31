# Color Perception Trainer – MVP Blueprint

## Goal

Build a browser-based training application that develops a painter's ability to perceive color the way experienced watercolor artists do.

The emphasis is **not** on memorizing color names, but on learning to decompose any color into:

- Hue
- Lightness
- Chroma
- Underlying temperature bias
- Likely pigment mixture

The app should be fully procedural—no image assets or photographs are required for the MVP.

---

# Design Philosophy

The app should function like a musical ear trainer.

Users should learn to recognize relationships rather than memorize answers.

Every exercise must have an objectively correct answer generated from mathematical color models.

The long-term goal is to train users to stop seeing colors categorically ("brown", "gray", "olive") and instead perceive:

- underlying hue
- value
- saturation
- pigment bias

---

# Technical Stack

- React
- TypeScript
- Vite
- Browser-only (no backend)
- LocalStorage for persistence
- CSS `oklab()` or `oklch()` for rendering colors

The application should be deployable as a static site (GitHub Pages).

---

# Core Color Engine

## Canonical Representation

Internally, the application should use **OKLab exclusively**.

```ts
interface ColorSample {
    L: number;
    a: number;
    b: number;
}
```

This is the **only** color representation that should be stored internally.

OKLab is chosen because it forms a true Cartesian vector space.

Advantages:

- Euclidean distance is meaningful.
- Convex combinations are simple weighted averages.
- No discontinuity at 360°.
- Easy interpolation.
- Easy optimization.
- Easy nearest-neighbor search.
- Easy future extension to more sophisticated pigment models.

Whenever hue or chroma are needed for the UI, convert temporarily to OKLCH.

Do **not** store both representations.

---

## Human-Friendly Representation

When presenting colors to the user (feedback, debugging, explanations), convert to OKLCH.

This exposes intuitive painter concepts:

- Lightness
- Chroma
- Hue

Example:

```
Lightness: 0.63
Chroma: 0.14
Hue: 82°
```

Internally these values should always be computed from OKLab rather than stored independently.

---

# Geometry

## Distance

Color distance should be standard Euclidean distance in OKLab.

```text
distance² =
(L₁-L₂)² +
(a₁-a₂)² +
(b₁-b₂)²
```

This avoids problems caused by hue-angle wrapping.

---

## Mixing

Virtual pigment mixing should initially be implemented as convex combinations in OKLab.

Example:

```text
MixedColor =
0.70 × WarmYellow +
0.30 × WarmRed
```

This is simply a weighted average of `(L,a,b)` vectors.

No special handling of hue is required.

**Important:** This is a perceptual interpolation model, **not** a physically accurate watercolor simulation.

The mixing engine should therefore be isolated behind an interface so it can later be replaced with a Kubelka–Munk or spectral pigment model.

---

# Virtual Watercolor Palette

Define six virtual pigment anchors.

These are learning references rather than exact commercial pigments.

| Pigment | L | C | H |
|---------|---:|---:|---:|
| Cool Yellow | 0.93 | 0.17 | 110 |
| Warm Yellow | 0.91 | 0.17 | 90 |
| Warm Red | 0.64 | 0.23 | 30 |
| Cool Red | 0.62 | 0.24 | 355 |
| Warm Blue | 0.56 | 0.18 | 285 |
| Cool Blue | 0.60 | 0.18 | 235 |

During initialization, convert these once into OKLab and store only their `(L,a,b)` values.

Future versions may replace these synthetic anchors with measured pigment data.

---

# Exercise Types

## 1. Hidden Undertone

Display a single color. 
It should be a "neutral", generally something in the beige/brown/grey region. This will need to be defined precisely.

Question:

> Which primary family dominates?

Choices:

- Yellow
- Red
- Blue

Follow-up:

> Does it lean toward the warm or cool version?

Examples:

- Warm Yellow
- Cool Yellow

Score both answers independently.

---

## 2. Relative Shift 1

Display two colors.

Ask:

- Which is lighter?
- Which is more saturated?
- Which is warmer within its primary family?

Only one perceptual dimension should differ.

---

## 3. Relative Shift 2

Generate a random color. Mix this with some % of one of the 6 warm/cool primaries.

Display both colors.

Ask:
- Which warm/cool primary should be added to the first to create the second.

Difficulty scales with the mixing fraction.

# Pigment Interpretation Layer

Build a second abstraction above the color engine.

Given a generated color:

- compute distance to each pigment anchor
- identify nearest anchors
- estimate likely pigment influence

Example output:

- 72% Warm Yellow
- 28% Warm Red

This is purely interpretive.

The perceptual engine remains the source of truth.

---

# Feedback

Every exercise should explain *why* the answer is correct.

Example:

```
Underlying hue:
32°

Primary family:
Yellow

Bias:
Warm

Lightness:
0.42

Chroma:
0.08

Closest pigment anchors:

72% Warm Yellow
28% Warm Red
```

The purpose of feedback is to teach perceptual decomposition rather than simply indicate correct/incorrect.

---

# Adaptive Difficulty

Track performance separately for:

- Hue
- Chroma
- Lightness
- Warm/Cool bias

Increase difficulty independently for each skill.

Users should practice weak areas more frequently.

---

# Architecture

```
Color Engine
        ↓
Exercise Generator
        ↓
Question Renderer
        ↓
Scoring Engine
        ↓
Statistics & Progress
```

Each layer should remain independent.

Exercise generation should have no knowledge of the UI framework.

---

# Success Metrics

The MVP should:

- Generate unlimited procedural exercises.
- Have mathematically objective answers using OKLCH.
- Teach users to perceive colors as combinations of hue, lightness, chroma, and primary bias.
- Store progress locally.
- Provide immediate explanatory feedback.
- Run entirely in the browser, friendly for desktop or mobile.

---

# Future Enhancements

## Watercolor Mixing Model

Instead of interpolating in OKLCH, generate colors by virtually mixing pigments.

This would produce more painter-realistic colors.

---

## Real Pigment Anchors

Replace synthetic anchors with measured values for real watercolor pigments.

Support multiple palettes:

- Daniel Smith
- Winsor & Newton
- M. Graham
- Schmincke
- Holbein

---

## Daily Practice

Implement short adaptive practice sessions (5–10 minutes).

---

## Statistics

Track:

- Hue accuracy
- Value accuracy
- Chroma accuracy
- Warm/Cool accuracy
- Reaction time

Display long-term progress.

---

## Color Confusion Map

Identify systematic mistakes.

Example:

- Confuses cool reds with warm reds.
- Confuses muted oranges with muted yellows.
- Consistently underestimates chroma.

Use this data to generate targeted exercises.

---

## Image-Based Mode

After the procedural engine is complete, support:

- uploaded photos
- paintings
- reference images

Automatically sample colors and generate exercises using the same perceptual engine.

---

# Design Principles

1. **Perceptual truth lives in OKLCH.**
   Every exercise has an objectively correct answer.

2. **Pigment interpretation is a separate layer.**
   Watercolor concepts should not influence scoring.

3. **Train perception, not memorization.**
   Avoid categorical color names whenever possible.

4. **Teach relationships.**
   Every exercise should help users answer questions like:

   - Which primary dominates?
   - Which neighboring primary is influencing it?
   - Is this higher or lower chroma?
   - Is this lighter or darker?
   - Which virtual pigments best explain this color?

5. **Keep the architecture modular.**
   The color engine, pigment model, exercise generator, and UI should remain loosely coupled so more realistic pigment simulation can be introduced later without redesigning the application.