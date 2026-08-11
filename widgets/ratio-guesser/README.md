# Ratio Guesser

An aspect-ratio perception trainer for observational drawing. Match an adjustable rectangle or plus sign to a generated reference shape, then receive numerical and visual calibration feedback.

## Status

Initial rollout implemented with rectangle and plus-sign target/user pairings, nested natural-ratio difficulty grids, decimal and fraction feedback, immediate scoring, and an explanatory overlay.

## Product plan

`vision.md` defines the learning objective, one-slider interaction, local-bounding-box ratio rule, independently selected target and user objects, staged object-class rollout, scoring, optional local progress, and future extensions.

`DESIGN_HANDOFF.md` translates the approved MVP into implementation requirements, including the shipped modes, generator contract, slider values, interaction states, accessibility expectations, and acceptance criteria.

## Run locally

Serve the parent `widgets/` directory with a static HTTP server, then open `/ratio-guesser/`. There is no install or build step.
