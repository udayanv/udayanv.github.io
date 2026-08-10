# Color Perception Trainer

A browser-only learning app for practicing measurable color relationships. It currently includes Relative Shift and Hidden Undertone exercises, procedural questions, educational feedback, a palette reference, difficulty controls, and local progress.

## Status

Active development. This is the newer successor to `color-game/`, but it has a different exercise model and toolchain.

## Commands

This project uses pnpm.

```text
pnpm install
pnpm dev
pnpm test
pnpm build
```

The Vite base is relative so the production output can run from a GitHub Pages subdirectory.

## Architecture

```text
src/
├── domain/           Color, palette, exercise, and scoring rules
├── application/      Session orchestration, registry, progress, and ports
├── infrastructure/   Browser persistence and randomness adapters
└── ui/               React screens and presentation
```

Dependencies should point inward: domain code must not depend on React, browser storage, or infrastructure implementations.

## Project documentation

- `docs/product-plan.md` — active product and architecture plan
- `docs/implementation-brief.md` — historical implementation brief tied to the active plan
- `docs/archive/` — superseded reference material; do not treat it as current guidance

The app currently owns its visual system in `src/ui/styles.css`. Consolidate shared cross-widget tokens only during an intentional design migration; the domain and application layers must remain independent of that choice.
