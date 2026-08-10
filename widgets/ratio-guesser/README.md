# Ratio Guesser

A planned aspect-ratio perception trainer for observational drawing. The user matches an adjustable normalized rectangle to a generated reference shape, then receives the actual height-to-width ratio, estimated ratio, and relative error.

## Status

MVP defined; implementation has not started. The current plan calls for a static HTML, CSS, and JavaScript widget with no backend.

## Product plan

`vision.md` defines the learning objective, one-slider interaction, local-bounding-box ratio rule, eight generated-shape modes, scoring, optional local progress, and future extensions.

`DESIGN_HANDOFF.md` translates the approved MVP into implementation requirements, including the shipped modes, generator contract, slider values, interaction states, accessibility expectations, and acceptance criteria.

Before implementation, resolve the remaining MVP choices recorded there:

- direct or logarithmic slider mapping;
- rotation ranges for the rotated modes;
- exact Easy, Medium, and Hard slider step sizes;
- deterministic smooth-blob generation for arbitrary-shape mode;

Once those choices are settled, copy `widget-template/` and retain the zero-build stack specified by the plan.
