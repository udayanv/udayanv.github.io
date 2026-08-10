MVP Design Document: Aspect Ratio Trainer

Vision

Create a simple web application that trains one fundamental perceptual skill used in observational drawing:

«Estimate the aspect ratio of an object independent of its size.»

The application should be lightweight enough to run entirely as a static GitHub Pages site (HTML/CSS/JavaScript only).

---

Learning Objective

Develop the ability to accurately perceive:

- height-to-width ratio
- width-to-height ratio

This is one of the first measurements artists make when constructing a drawing, often by estimating the bounding box of a subject.

The application intentionally does not train:

- drawing
- contour accuracy
- rendering
- shading
- perspective

It isolates one perceptual skill.

---

Core Idea

The user is shown a reference object.

They adjust a normalized rectangle until its aspect ratio matches the perceived aspect ratio of the reference.

Absolute size is removed from the problem.

The only parameter being estimated is

[
\text{aspect ratio}

\frac{\text{height}}{\text{width}}.
]

---

User Workflow

Step 1

Display a reference object.

Examples:

- rectangle
- silhouette
- fruit
- vase
- bottle
- head

---

Step 2

Display an adjustable rectangle.

The rectangle always has

- fixed width = 1

The slider controls only

- height

Thus the slider directly controls aspect ratio.

---

Step 3

The user adjusts the slider until the rectangle matches the perceived aspect ratio of the reference.

---

Step 4

Submit.

Reveal:

- actual ratio
- estimated ratio
- percent error

Optionally record results locally.

---

Interface

Reference

     🍐


Adjustable

████
████
████

--------------------------
Aspect Ratio Slider
--------------------------

          Submit

No drawing.

No keyboard shortcuts required.

One slider.

One button.

---

Scoring

Let

- r = true aspect ratio
- \hat r = user's estimate

Possible error metrics:

Absolute error

[
|r-\hat r|
]

Relative error

[
\frac{|r-\hat r|}{r}
]

The MVP should report relative error.

Example:

Actual

1.42

Estimated

1.35

Relative error

4.9%

---

Reference Images

Initial MVP should use a small curated dataset.

Suggested categories:

- geometric shapes
- fruit
- bottles
- mugs
- trees
- animals
- simple household objects

Each image should have:

- transparent background if possible
- precomputed bounding box
- known aspect ratio

No image processing required in the MVP.

---

Technology

- HTML
- CSS
- JavaScript
- Canvas (optional)

No backend.

No database.

Deploy via GitHub Pages.

---

Difficulty System

Difficulty is controlled independently along two axes.

Axis 1 — Rotation

Purpose:

Prevent users from relying on horizontal/vertical comparisons.

Levels

Level 0

Reference upright.

Level 1

Random rotation

±15°

Level 2

Random rotation

±45°

Level 3

Random rotation

0–360°

The adjustable rectangle remains upright.

The user must mentally estimate the object's envelope.

---

Axis 2 — Observation Time

Purpose:

Shift from direct visual comparison toward perceptual memory.

Levels

Level 0

Reference always visible.

Level 1

Reference disappears after

10 seconds.

Level 2

Reference disappears after

5 seconds.

Level 3

Reference disappears after

2 seconds.

Level 4

Flash mode

Reference shown for

1 second.

The adjustable rectangle remains visible.

---

Difficulty Matrix

The two axes are independent.

Examples:

Easy

- Upright
- Always visible

Medium

- Rotated
- Always visible

Medium

- Upright
- Five-second exposure

Hard

- Rotated
- Five-second exposure

Expert

- Arbitrary rotation
- One-second exposure

---

Progress Tracking

Optional local statistics:

- average relative error
- median relative error
- best session
- number of completed trials

No accounts required.

Use browser local storage.

---

Future Extensions

Potential future exercises built on the same interaction model:

- angle estimation
- ellipse eccentricity
- bounding-box estimation for silhouettes
- relative length estimation
- feature placement within bounding boxes

All use the same principle:

Normalize away nuisance parameters and estimate one latent geometric quantity.

---

Open Questions

1. Reference Object

Should the MVP begin with:

- rectangles
- silhouettes
- photographs
- simplified drawings

Rectangles validate the interaction.

Silhouettes are closer to real drawing.

---

2. Bounding Box Definition

Should the user estimate:

- axis-aligned bounding box
- minimum-area bounding box (rotates with the object)

The latter is probably more relevant to drawing but requires more preprocessing.

---

3. Slider Mapping

Should the slider represent:

- aspect ratio directly
- logarithm of aspect ratio

A logarithmic mapping provides equal sensitivity to tall and wide objects.

---

4. Error Metric

Possible options:

- relative error
- log-ratio error
- percentage difference

The metric should feel intuitive while remaining mathematically well-behaved.

---

5. Immediate vs Delayed Feedback

Should the answer appear immediately after each trial, or after completing a batch of 10–20 trials?

Immediate feedback may improve calibration.

Delayed feedback may encourage independent estimation.

This should be evaluated experimentally.

---

6. Difficulty Progression

Should rotation and exposure time be:

- selected manually
- automatically increased as performance improves
- randomized

Adaptive difficulty could maintain an approximately constant success rate.

---

Guiding Principle

The application trains perceptual estimation, not drawing.

Every exercise should isolate a single latent geometric quantity while removing irrelevant variables such as scale.

The interaction should remain as simple as possible:

One reference. One slider. One hidden parameter. One objective score.