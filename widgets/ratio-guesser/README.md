# Ratio Guesser

A planned aspect-ratio perception trainer for observational drawing. The user matches an adjustable normalized rectangle to a reference object, then receives the actual ratio, estimated ratio, and relative error.

## Status

MVP defined; implementation has not started. The current plan calls for a static HTML, CSS, and JavaScript widget with no backend.

## Product plan

`vision.md` defines the learning objective, core interaction, scoring, reference-image requirements, two-axis difficulty system, optional local progress, and future extensions.

Before implementation, resolve the remaining MVP choices recorded there:

- initial reference type;
- bounding-box definition;
- direct or logarithmic slider mapping;
- final error metric presentation;
- immediate or delayed feedback;
- manual, automatic, or randomized difficulty progression.

Once those choices are settled, copy `widget-template/` and retain the zero-build stack specified by the plan.
