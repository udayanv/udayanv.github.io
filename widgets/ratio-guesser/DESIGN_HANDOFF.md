# Ratio Guesser — Design Handoff

## Build Goal

Build a zero-dependency static web widget that teaches aspect-ratio estimation. In every round, a person compares a generated target silhouette with an upright user-selected object whose **width is fixed** and whose **height is set by one slider**. On submission, show a visual comparison and numerical feedback.

This document is implementation direction. Follow it when it is more specific than `vision.md`; retain `vision.md` as the product rationale.

## Scope

### Ship in the first implementation

- Upright rectangle and plus sign as independently selectable target and user object classes.
- All four initial pairings: rectangle → rectangle, rectangle → plus, plus → rectangle, and plus → plus.
- Manual target-object and user-object selection.
- Easy, Medium, and Hard slider granularity.
- One generated round at a time, immediate feedback, and a Next shape action.
- Numerical results and a post-submit visual overlay/comparison.
- Responsive, accessible keyboard and pointer interaction.

### Deliberately defer

- Rotated rectangles, rotated plus signs, offset plus signs, ovals, rotated ovals, arbitrary smooth blobs, and their selectable modes.
- Random/mixed-mode sessions.
- Timed viewing, adaptive difficulty, accounts, leaderboards, and persistence.

Do not add placeholder controls for deferred features. Keep the shape-generation API extensible so a blob generator can be added later.

## Non-Negotiable Measurement Rule

The answer is always the reference's local, pre-rotation ratio:

`targetRatio = localHeight / localWidth`

Do not calculate an axis-aligned bounding box after drawing a rotation. A rotated 2:1 rectangle still has a target ratio of `0.5` (height ÷ width) even if its on-screen bounds look nearly square.

The adjustable user object is always upright:

`estimateRatio = userObjectHeight / fixedWidth`

Its fixed width can be any convenient rendering value. Its rendered height must be derived directly from the slider's selected ratio. The target and user object classes may differ; the exercise compares their ratios, not their silhouettes.

## Information Architecture and Round Flow

```
select target object + user object + difficulty
          │
          ▼
generate a new round ──► adjust slider ──► Submit
                                              │
                                              ▼
                                  locked result / comparison
                                              │
                                              ▼
                                        Next shape
```

Changing either object selection or difficulty before submission immediately generates a fresh, unanswered round. The slider must be disabled after submission; Next shape creates another round using the current selections.

## UI Requirements

Use the repository's static widget template and shared visual tokens. The widget must be understandable without an instructional modal.

### Header

- Title: **Ratio Guesser**
- One short instruction: “Match the reference shape’s height-to-width ratio.”
- A compact reminder, where space permits: “Rotation does not change the answer.”

### Controls

- A visible label and native `<select>` for **Target object**.
- A visible label and native `<select>` for **Your object**.
- A visible label and native `<select>` or segmented control for **Difficulty**: Easy, Medium, Hard.
- No Random option in this release.

### Exercise Area

Place the two panels side-by-side on wide screens and vertically stacked on narrow screens.

1. **Reference panel**
   - Title: “Target”.
   - Draw only the filled target silhouette before submission.
   - Do not show dimensions, a bounding rectangle, angle, or numerical ratio.
   - Fit every shape into a common safe visual frame with generous padding. It is acceptable for each shape to be scaled differently to fit that frame; that reinforces that absolute size is irrelevant.

2. **Your estimate panel**
   - Title: “Your estimate”.
   - Draw the upright, filled selected user object centered in a similarly sized frame.
   - Keep its width constant through the round. Change only height as the slider moves.
   - Keep the object visibly within its panel for every supported ratio.

### Input and Actions

- Label the slider **Adjust height**.
- Add a live text value such as `1.25 · 5:4` that updates as the slider moves. Show both the decimal and whole-number ratio, but do not display the target value.
- Provide a primary **Submit estimate** button.
- Before submission, no score or answer is visible.
- After submission, replace or supplement the primary action with **Next shape**.

## Result State

After submission, preserve the generated reference and current estimate. Present:

- Target ratio: `H ÷ W = 1.23`
- Your ratio: `H ÷ W = 1.20`
- Relative error: `2.4%`
- A short qualitative label.

Use these initial qualitative bands, centralized as constants:

| Relative error | Label |
| --- | --- |
| `≤ 2%` | Excellent |
| `> 2%` and `≤ 5%` | Very close |
| `> 5%` and `≤ 10%` | Close |
| `> 10%` | Keep calibrating |

Also calculate log-ratio error for internal comparisons:

`logError = abs(Math.log(estimateRatio / targetRatio))`

It need not be displayed in the initial UI. User-facing percent error is:

`relativeErrorPercent = abs(targetRatio - estimateRatio) / targetRatio * 100`

### Visual Comparison

After submission, make the target-vs-estimate relationship visible. A reliable implementation is a dedicated comparison canvas/SVG with both shapes centered on the same origin and normalized to the same fixed width:

- draw the true target silhouette in a solid, high-contrast color;
- draw the user's upright object in a contrasting semi-transparent fill and/or clear outline;
- retain the target's display rotation in this comparison when future rotated classes are added;
- do not add a target bounding box unless it is visually subtle and explicitly described as the unrotated local box.

The overlay is explanatory feedback. It must not alter the target, slider value, or score.

## Shared Object-Class Contract

Implement each object class once, as an isolated definition rather than branching through the rendering layer. The same class must construct both target and user geometry. The roles differ only in their dimensions and transform: a target receives generated width and height and may later receive a display rotation; a user receives fixed width and slider-selected height and stays upright.

```js
{
  id: 'rectangle',
  label: 'Rotated rectangle',
  localWidth: number,
  localHeight: number,
  createGeometry({ width, height }) { /* mode-specific local geometry */ },
  draw(context, { width, height, rotationDegrees, ...options }) { /* draw local geometry, then optional rotation */ }
}
```

Required invariants:

- `localWidth` and `localHeight` describe the finished silhouette before display rotation.
- `targetRatio` is derived once as `localHeight / localWidth`.
- Shape-specific randomness is stored in `geometry`, so a submitted round can be redrawn exactly.
- Drawing code uses `save()` / `restore()` around transforms and never mutates the geometry.
- Each class must return a connected, legible filled silhouette in both roles.
- A class must use identical local geometry rules in both roles. Do not create separate target and user versions of rectangle or plus.
- In the initial release, pass `rotationDegrees: 0` in both roles. Future rotated modes may pass a nonzero rotation only when drawing the target.

### Shipped object classes

| Object class | Shared local construction | Role-specific dimensions | Constraints |
| --- | --- | --- |
| Rectangle | One filled rectangle. | Target receives generated width and height; user receives fixed width and slider-controlled height. | `rotationDegrees = 0`. |
| Plus sign | Union of centered filled vertical and horizontal bars. | Target receives generated width and height; user receives fixed width and slider-controlled height. | Bars have non-zero thickness and overlap. Keep both bar thicknesses fixed relative to the local width while changing the vertical bar's length. |

For generated dimensions, select a target ratio within `[0.4, 2.5]`. Avoid targets close to the immediately previous target within the same mode. Treat the ratio as the primary randomized parameter; derive a convenient local width and height from it rather than independently randomizing both.

### Future object classes

Add each new class once, then make that shared definition selectable in both target and user selectors. Do not introduce target-only classes or separate target/user versions unless a later design decision explicitly changes this symmetry.

Planned classes are rotated rectangle, rotated plus sign, offset plus sign, oval, rotated oval, and arbitrary smooth blob. Rotated classes must preserve the local-bounds measurement rule. User objects remain upright unless a future request explicitly changes that policy.

### Future blob extension

Reserve an `arbitrary-blob` object-class ID but do not add it to the first-release selector. Its future shared definition must produce a smooth, connected, non-self-intersecting local silhouette with explicit local dimensions. No blob algorithm is approved yet.

## Rotation and Rendering

Choose a rotation angle after creating local geometry. For rotated modes, use a non-axis-aligned range such as `20°–70°`, randomly signed; keep the range and exclusions in named constants for later tuning.

Target drawing should:

1. translate to the panel center;
2. scale the complete local shape to fit the common safe frame;
3. rotate by `rotationDegrees`;
4. draw local geometry centered at the origin.

Because a rotated shape can have a larger screen footprint than its local dimensions, calculate the fit scale using its rotated extents or use intentionally conservative frame padding. Never let it clip.

## Slider and Difficulty

Use a native range slider whose integer value indexes the active natural-ratio grid. Display and announce the ratio represented by that index rather than the index itself.

Shared bounds:

```js
const RATIO_MIN = 0.4;
const RATIO_MAX = 2.5;
```

Define a natural ratio as a reduced fraction whose numerator and denominator are small positive whole numbers. Keep only ratios within the shared bounds and sort them numerically. Difficulty controls the largest allowed numerator or denominator:

| Difficulty | Maximum fraction term | Grid size |
| --- | --- | --- |
| Easy | `5` | 13 ratios |
| Medium | `8` | 27 ratios |
| Hard | `12` | 57 ratios |

Each harder grid contains every ratio from the easier grids and adds more complex proportions. Reciprocal pairs must both be present. Generate the target directly from the active grid so every answer is exactly reachable. Initialize each new round at `1.00 · 1:1`. Set the range input to `min = 0`, `max = grid.length - 1`, and `step = 1`, and provide the represented decimal and fraction through `aria-valuetext`.

## Accessibility and Interaction Quality

- Use native buttons, labels, selects, and range input; every control must be keyboard operable.
- Ensure visible focus states and sufficient text/color contrast.
- Do not rely on color alone in the result overlay: differentiate target and estimate with fill opacity, outline, or a legend.
- Give the reference panel a useful accessible summary before submission, such as “Reference shape: rotated oval. Estimate its height-to-width ratio.” Do not expose its target ratio in accessible text before submission.
- Announce feedback in an `aria-live` region after submission.
- Respect reduced-motion preferences; no animation is necessary for the core task.

## State Model

Keep app state small and explicit:

```js
{
  selectedTargetObject: string,
  selectedUserObject: string,
  difficulty: 'easy' | 'medium' | 'hard',
  round: ShapeGeneratorResult | null,
  estimateRatio: number,
  submitted: boolean
}
```

Derive `targetRatio`, both error metrics, display strings, and fit transforms from this state rather than maintaining duplicate mutable values.

## Acceptance Criteria

The implementation is complete when:

- rectangle and plus sign can each be selected independently as target and user object, producing all four initial pairings;
- each round produces a target within `0.4–2.5` based on its local dimensions;
- rotation never changes the target ratio;
- the estimate user object has fixed width and changes only height;
- Easy, Medium, and Hard use the 13-, 27-, and 57-value natural-ratio grids, and every target is exactly reachable on its active grid;
- submitting freezes the round and slider, computes correct numerical feedback, and displays a comparison overlay;
- Next shape creates a fresh shape in the selected mode and restores the answering state;
- target-object, user-object, or difficulty changes create a fresh unanswered round;
- the widget works using only static HTML, CSS, and JavaScript, with no build step or external service;
- mouse, touch, and keyboard users can complete a round.

## Implementation Notes

- Prefer Canvas for concise geometry and transform handling, or SVG if its sizing and overlay behavior are simpler in the chosen template. Do not mix both unless there is a clear need.
- Put mode definitions, numeric bounds, rotation ranges, and difficulty steps in named constants near the generators.
- Keep random-number access behind a small helper. That will make deterministic, seedable test rounds easy to add later.
- Add a small developer-only way to inspect a round's mode, local dimensions, rotation, and target ratio while building, but do not expose it in the user-facing interface.
