# Ratio Guesser — Product Vision

## Vision

Create a small, static web application that trains a foundational observational-drawing skill: estimating an object's proportions independently of its absolute size.

Each exercise presents a generated target shape and a separate user-selected adjustable shape. The user uses one slider to scale one dimension of their shape until its proportions match the target shape's intended bounding-box ratio. They then submit an answer and receive clear feedback.

The first version uses geometric, programmatically generated shapes rather than image assets. This keeps every trial self-contained, makes the target ratio known exactly, and lets difficulty vary without an image-processing pipeline.

## Learning Objective

Develop the ability to estimate both:

- height relative to width
- width relative to height

The exercise concerns the reference shape's local, unrotated bounding box: the smallest upright rectangle that contains the shape before any display rotation is applied. Users should learn to mentally recover that underlying envelope even when the visible shape is rotated or visually complex.

The application intentionally does not train contour drawing, shading, perspective, or rendering. It isolates proportion estimation.

## Core Interaction

1. Generate a reference shape with a known local width and height.
2. Optionally rotate that finished shape for display.
3. Show an upright adjustable user object alongside it.
4. Let the user move one slider to change the user object's variable dimension.
5. On submission, reveal the target and estimated ratios and report error.

Absolute scale is deliberately unimportant. The reference and adjustable shapes may be rendered at different overall sizes.

## Ratio Convention

The canonical target ratio is:

`height / width`

Every adjustable user object has a fixed overall width and a slider-controlled overall height:

Its width is fixed and the slider changes only its height. The slider therefore directly represents the height ÷ width estimate. The UI should label the control plainly (for example, “Adjust height”), while feedback always shows height ÷ width so results remain comparable.

For every mode, calculate the target from the shape's dimensions **before rotation**. Do not use the screen-space, axis-aligned bounding box after rotation.

## Object Classes and Rollout

Target and user objects are selected independently from the same set of object classes. Any user object may be used to estimate the ratio of any target object: a plus may match a rectangle, and a rectangle may match a plus. The task remains bounding-box proportion rather than silhouette matching.

An object class has the same local geometry rules in either role. The roles differ only in how its dimensions are chosen: target dimensions are generated for the round, while user width is fixed and user height comes from the slider. A future target-only class is not assumed; every added class should be usable as both a target and a user object unless a later design decision explicitly says otherwise.

### Initial release

Ship these two object classes as both target and user objects:

| Object class | Target construction | User-object behavior |
| --- | --- | --- |
| Upright rectangle | An unrotated filled rectangle. | Fixed width; slider changes height. |
| Plus sign | A centered filled vertical bar and horizontal bar. | Fixed overall width; slider changes overall height. Bar thicknesses remain fixed relative to the fixed width. |

This produces four supported pairings: rectangle → rectangle, rectangle → plus, plus → rectangle, and plus → plus.

### Future object classes

The following classes are planned as modular additions. They should not appear in the first-release selectors until their shared object-class definition is implemented:

| Mode | Reference construction | Target ratio |
| --- | --- | --- |
| 1. Upright rectangle | An unrotated rectangle; the base calibration mode. | Rectangle height ÷ width. |
| 2. Rotated rectangle | A rectangle created upright, then rotated for display. | Rectangle height ÷ width before rotation. |
| 3. Plus sign | A centered vertical bar and horizontal bar, like a rectangle folded in half twice and represented by its folds. | Overall plus-sign height ÷ width. |
| 4. Rotated plus sign | A centered plus sign created in local coordinates, then rotated for display. | Overall plus-sign height ÷ width before rotation. |
| 5. Offset plus sign | Perpendicular horizontal and vertical bars whose intersection can be offset from their midpoints. | Overall local bounding-box height ÷ width. |
| 6. Oval | An upright ellipse. | Ellipse major vertical extent ÷ horizontal extent. |
| 7. Rotated oval | An ellipse created upright, then rotated for display. | Ellipse height ÷ width before rotation. |
| 8. Arbitrary shape | A smooth, generated blob with a defined local bounding box. | Blob local bounding-box height ÷ width. |

### Mode Notes

- Plus signs use filled bars of non-zero thickness, not one-pixel lines, so their envelopes read as shapes. For an adjustable plus, keep both bar thicknesses fixed while changing the vertical bar's length to set the overall height.
- In the offset-plus mode, constrain offsets so the bars still intersect and the silhouette remains one connected shape.
- “Upright” means the reference is not display-rotated; it does not require every generated rectangle to be taller than wide. Early presets may bias this mode toward taller shapes for a gentle introduction.
- The arbitrary-shape mode is intentionally a later implementation milestone. Its generator must produce smooth, non-self-intersecting silhouettes and retain the source dimensions used to define its local bounding box.

## Rotation Rule

Rotation is part of selected target classes, not a separate measurement rule. Build every target shape in its local coordinate system first, record its local width and height, and only then apply a display transform. User objects remain upright in this release.

This rule matters especially for rotated rectangles and ovals: their visible, screen-aligned bounds change with angle, but the answer does not.

## Interface

The round should remain deliberately spare:

- a manual mode selector
- a manual user-object selector
- an Easy / Medium / Hard difficulty selector
- a reference-shape panel
- an adjustable-object panel
- one labeled slider
- a submit button
- a result area revealed after submission
- a next-shape button

The adjustable user object always remains upright. The target panel should not show guide boxes, dimensions, or numerical hints before submission. Render all target objects at a common, practical visual footprint; this keeps the task focused on proportion and is the simplest initial implementation.

After submission, show an overlay that compares the true target shape with the user's generated object, together with the numerical ratios. The overlay should preserve the shapes' relative proportions while making differing silhouettes understandable; it is explanatory feedback, not a second guessing interaction.

## Feedback and Scoring

Let `r` be the true ratio and `r̂` be the user's estimated ratio.

Calculate the canonical score with symmetric log-ratio error:

`abs(ln(r̂ / r))`

This treats equivalent multiplicative over- and under-estimates equally. For user-facing feedback, also report the familiar relative error:

`abs(r - r̂) / r × 100%`

After submission, show:

- actual height ÷ width ratio
- estimated height ÷ width ratio
- relative error percentage
- log-ratio score (optional in the interface, required for internal comparison and future adaptation)
- a concise qualitative result (for example, “Very close”)

Immediate feedback is the default for the initial implementation because calibration is the central learning goal.

## Randomization and Difficulty

Each generated trial should randomize its ratio over a bounded, useful range. Suggested initial range: `0.4` to `2.5` for height ÷ width. Avoid near-duplicate consecutive targets when repeatedly playing a mode.

The user selects target and user object classes manually. A future **Random** mode may select among implemented target classes and pairings, but it is not required for the first release.

Difficulty controls slider granularity, not which visual target is shown. All difficulty levels use the same fixed-width adjustable user object and ratio range:

| Difficulty | Slider behavior |
| --- | --- |
| Easy | Coarse discrete height steps; intended for early calibration. |
| Medium | Smaller discrete steps. |
| Hard | Fine discrete height steps for precise matching. |

The exact step counts and values should be selected during implementation so the full allowed ratio range remains reachable at every level. The visible slider should snap to these steps.

Suggested learning progression across modes is:

1. upright rectangles as both target and user objects
2. plus signs as both target and user objects, including mixed rectangle/plus pairings
3. rotated rectangles and upright ovals
4. rotated and offset plus signs and rotated ovals
5. arbitrary smooth blobs

Future options may add timed viewing, Random/mixed-mode sessions, or adaptive mode suggestions based on recent log-ratio error. These should not complicate the one-slider interaction in the first release.

## Technology and Constraints

- HTML, CSS, and JavaScript only
- Canvas or SVG for generated shapes
- no backend or account system
- static GitHub Pages deployment
- no image assets or image-processing dependency for the generated-shape MVP

## Progress Tracking

Optional browser-local statistics:

- completed trials
- average and median relative error
- per-mode accuracy
- recent-answer history

No account is required; use local storage if progress tracking is implemented.

## Implementation Decisions

1. **Slider mapping:** use an integer slider index into the active natural-ratio grid; display and announce the represented ratio rather than the index.
2. **Natural-ratio grids:** use reduced fractions within `0.4–2.5`. Easy, Medium, and Hard allow numerator and denominator terms up to 5, 8, and 12 respectively. Generate targets from the active grid so every answer is reachable.
3. **Rotation ranges:** define sensible angle ranges for future rotated target classes, including whether near-upright angles should be excluded.
4. **Blob generator:** specify a deterministic seeded algorithm and constraints for smoothness, connectedness, and local bounds. The shape-mode architecture should use a pluggable generator interface so this mode can remain unavailable until specified without affecting the other modes.

## Guiding Principle

One reference shape. One slider. One hidden proportion. One objective score.

Every mode should preserve that simplicity while making the user judge the shape's local bounding box rather than its absolute scale or its rotated screen footprint.
