# Color Mixer

A zero-build color tool with synchronized RGB, RYB, and HVC controls, a preview, hexadecimal input, and conversion guidance.

## Status

Available.

## Run locally

Serve the parent `widgets/` directory with a static HTTP server and open `color-mixer/`. There is no install or build step.

## Structure

- `index.html` — interface, conversion help, and metadata
- `style.css` — responsive presentation
- `script.js` — controls, state synchronization, preview, copy behavior, and dialog behavior
- `color-conversions.js` — model conversion functions

Conversion math is intentionally separated from interface state. Preserve that boundary when adding models or tests. The widget does not currently consume the shared design styles; migrate it during a deliberate visual revision.

