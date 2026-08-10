# Color Perception Game

A zero-build CIELAB training game. Players compare two swatches and classify how the second changes along the L*, a*, and b* axes.

## Status

Available, legacy. This is the original multi-axis implementation; `color-perception-trainer/` is the newer learning-focused trainer. Keep this URL stable unless an explicit migration replaces it.

## Run locally

Serve the parent `widgets/` directory with a static HTTP server and open `color-game/`. There is no install or build step.

## Structure

- `index.html` — interface and accessible form structure
- `styles.css` — responsive presentation
- `script.js` — CIELAB conversion, question generation, scoring, and UI state

The widget is self-contained and does not currently consume the shared design styles. Adopt shared tokens as part of a deliberate redesign, not as an incidental refactor.
