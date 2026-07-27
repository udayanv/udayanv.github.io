"use strict";

const AXES = ["l", "a", "b"];

const AXIS_META = {
  l: {
    label: "L*",
    lower: "Darker",
    same: "Same lightness",
    higher: "Lighter",
  },
  a: {
    label: "a*",
    lower: "More green",
    same: "Same",
    higher: "More red",
  },
  b: {
    label: "b*",
    lower: "More blue",
    same: "Same",
    higher: "More yellow",
  },
};

const state = {
  round: null,
  submitted: false,
  score: {
    rounds: 0,
    totalCorrect: 0,
    axes: {
      l: { correct: 0, attempts: 0 },
      a: { correct: 0, attempts: 0 },
      b: { correct: 0, attempts: 0 },
    },
  },
};

const elements = {
  form: document.querySelector("#answer-form"),
  maxAxes: document.querySelector("#max-axes"),
  minDelta: document.querySelector("#min-delta"),
  minDeltaOutput: document.querySelector("#min-delta-output"),
  swatchA: document.querySelector("#swatch-a"),
  swatchB: document.querySelector("#swatch-b"),
  submit: document.querySelector("#submit-answer"),
  answerProgress: document.querySelector("#answer-progress"),
  results: document.querySelector("#results"),
  roundSummary: document.querySelector("#round-summary"),
  deltaList: document.querySelector("#delta-list"),
  labA: document.querySelector("#lab-a"),
  labB: document.querySelector("#lab-b"),
  nextRound: document.querySelector("#next-round"),
  totalScore: document.querySelector("#total-score"),
  liveResult: document.querySelector("#live-result"),
};

/**
 * Converts CIELAB (D50) to display-ready sRGB (D65).
 * The conversion passes through XYZ, applies a Bradford D50→D65 adaptation,
 * and rejects the color if any linear sRGB channel lies outside [0, 1].
 */
function labToSrgb(lab) {
  const fy = (lab.l + 16) / 116;
  const fx = fy + lab.a / 500;
  const fz = fy - lab.b / 200;
  const epsilon = 216 / 24389;
  const kappa = 24389 / 27;

  const inverseLab = (value) => {
    const cube = value ** 3;
    return cube > epsilon ? cube : (116 * value - 16) / kappa;
  };

  // D50 reference white, normalized to Y = 1.
  const x50 = 0.96422 * inverseLab(fx);
  const y50 = 1.0 * inverseLab(fy);
  const z50 = 0.82521 * inverseLab(fz);

  // Bradford-adapted XYZ from D50 to D65.
  const x65 = 0.9555766 * x50 - 0.0230393 * y50 + 0.0631636 * z50;
  const y65 = -0.0282895 * x50 + 1.0099416 * y50 + 0.0210077 * z50;
  const z65 = 0.0122982 * x50 - 0.020483 * y50 + 1.3299098 * z50;

  const linear = {
    r: 3.2404542 * x65 - 1.5371385 * y65 - 0.4985314 * z65,
    g: -0.969266 * x65 + 1.8760108 * y65 + 0.041556 * z65,
    b: 0.0556434 * x65 - 0.2040259 * y65 + 1.0572252 * z65,
  };

  if (
    Object.values(linear).some(
      (channel) => !Number.isFinite(channel) || channel < 0 || channel > 1,
    )
  ) {
    return null;
  }

  const encode = (channel) =>
    channel <= 0.0031308
      ? 12.92 * channel
      : 1.055 * channel ** (1 / 2.4) - 0.055;

  const rgb = {
    r: Math.round(encode(linear.r) * 255),
    g: Math.round(encode(linear.g) * 255),
    b: Math.round(encode(linear.b) * 255),
  };

  return {
    ...rgb,
    css: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
  };
}

function randomBetween(min, max, random = Math.random) {
  return min + random() * (max - min);
}

function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function directionForDelta(delta) {
  if (delta === 0) return "same";
  return delta < 0 ? "lower" : "higher";
}

function roundToTenth(value) {
  return Math.round(value * 10) / 10;
}

/**
 * Uses rejection sampling for the whole pair. Base colors are kept away from
 * extreme LAB edges; a proposal is accepted only when both colors convert to
 * unclipped sRGB.
 */
function generateRound(maxAxes, minMagnitude, random = Math.random) {
  const maxAttempts = 10000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const labA = {
      l: roundToTenth(randomBetween(28, 78, random)),
      a: roundToTenth(randomBetween(-42, 42, random)),
      b: roundToTenth(randomBetween(-42, 42, random)),
    };

    const changedCount = 1 + Math.floor(random() * maxAxes);
    const changedAxes = shuffled(AXES, random).slice(0, changedCount);
    const deltas = { l: 0, a: 0, b: 0 };

    for (const axis of changedAxes) {
      const spread = Math.min(8, Math.max(3, minMagnitude * 0.45));
      const magnitude = roundToTenth(
        randomBetween(minMagnitude, minMagnitude + spread, random),
      );
      deltas[axis] = (random() < 0.5 ? -1 : 1) * magnitude;
    }

    const labB = {
      l: roundToTenth(labA.l + deltas.l),
      a: roundToTenth(labA.a + deltas.a),
      b: roundToTenth(labA.b + deltas.b),
    };

    // Preserve intended deltas exactly after rounding the proposed values.
    deltas.l = roundToTenth(labB.l - labA.l);
    deltas.a = roundToTenth(labB.a - labA.a);
    deltas.b = roundToTenth(labB.b - labA.b);

    const isVisuallyBounded =
      labB.l >= 18 &&
      labB.l <= 88 &&
      Math.abs(labB.a) <= 65 &&
      Math.abs(labB.b) <= 65;

    if (!isVisuallyBounded) continue;

    const rgbA = labToSrgb(labA);
    const rgbB = labToSrgb(labB);
    if (!rgbA || !rgbB) continue;

    return {
      labA,
      labB,
      rgbA,
      rgbB,
      deltas,
      changedAxes,
      correct: Object.fromEntries(
        AXES.map((axis) => [axis, directionForDelta(deltas[axis])]),
      ),
    };
  }

  throw new Error("Unable to generate an in-gamut LAB color pair.");
}

function selectedAnswers() {
  const formData = new FormData(elements.form);
  return Object.fromEntries(
    AXES.map((axis) => [axis, formData.get(axis)]),
  );
}

function updateAnswerProgress() {
  if (state.submitted) return;

  const answers = selectedAnswers();
  const answeredCount = AXES.filter((axis) => answers[axis] !== null).length;
  const complete = answeredCount === AXES.length;

  elements.submit.disabled = !complete;
  elements.answerProgress.textContent = complete
    ? "All three axes answered."
    : `${answeredCount} of 3 axes answered.`;
}

function clearFeedback() {
  document.querySelectorAll(".answer-option").forEach((option) => {
    option.classList.remove("is-correct", "is-incorrect");
    const feedback = option.querySelector(".option-feedback");
    feedback.textContent = "";
    feedback.setAttribute("aria-hidden", "true");
  });
}

function renderNewRound() {
  const maxAxes = Number(elements.maxAxes.value);
  const minMagnitude = Number(elements.minDelta.value);

  state.round = generateRound(maxAxes, minMagnitude);
  state.submitted = false;

  elements.form.reset();
  clearFeedback();
  elements.form
    .querySelectorAll("input")
    .forEach((input) => (input.disabled = false));
  elements.submit.hidden = false;
  elements.submit.disabled = true;
  elements.answerProgress.textContent = "Select an answer for all three axes.";
  elements.results.hidden = true;
  elements.swatchA.style.backgroundColor = state.round.rgbA.css;
  elements.swatchB.style.backgroundColor = state.round.rgbB.css;
  elements.liveResult.textContent = "";
}

function formatSigned(value) {
  if (value === 0) return "0.0";
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(1)}`;
}

function formatLab(lab) {
  return `L* ${lab.l.toFixed(1)}, a* ${lab.a.toFixed(1)}, b* ${lab.b.toFixed(1)}`;
}

function updateScore(correctByAxis) {
  state.score.rounds += 1;

  for (const axis of AXES) {
    const axisScore = state.score.axes[axis];
    axisScore.attempts += 1;
    if (correctByAxis[axis]) {
      axisScore.correct += 1;
      state.score.totalCorrect += 1;
    }
  }

  const totalAttempts = state.score.rounds * AXES.length;
  const roundWord = state.score.rounds === 1 ? "round" : "rounds";
  elements.totalScore.textContent =
    `${state.score.rounds} ${roundWord} · ` +
    `${state.score.totalCorrect} of ${totalAttempts} axis answers correct`;

  for (const axis of AXES) {
    const score = state.score.axes[axis];
    document.querySelector(`#score-${axis}`).textContent =
      `${score.correct} / ${score.attempts}`;
  }
}

function renderResults(answers, correctByAxis) {
  const correctCount = AXES.filter((axis) => correctByAxis[axis]).length;
  elements.roundSummary.textContent = `${correctCount} of 3 correct.`;

  for (const axis of AXES) {
    const fieldset = elements.form.querySelector(`[data-axis="${axis}"]`);
    const correctValue = state.round.correct[axis];
    const selectedValue = answers[axis];

    fieldset.querySelectorAll(".answer-option").forEach((option) => {
      const input = option.querySelector("input");
      const feedback = option.querySelector(".option-feedback");
      input.disabled = true;

      if (input.value === correctValue) {
        option.classList.add("is-correct");
        feedback.textContent =
          input.value === selectedValue ? "✓ Correct" : "✓ Correct answer";
        feedback.setAttribute("aria-hidden", "false");
      } else if (input.value === selectedValue) {
        option.classList.add("is-incorrect");
        feedback.textContent = "✕ Your choice";
        feedback.setAttribute("aria-hidden", "false");
      }
    });
  }

  elements.deltaList.replaceChildren(
    ...AXES.map((axis) => {
      const item = document.createElement("div");
      const direction = AXIS_META[axis][state.round.correct[axis]];
      item.className = "delta-item";

      const heading = document.createElement("strong");
      heading.textContent = `${AXIS_META[axis].label}: ${direction}`;

      const values = document.createElement("span");
      values.textContent =
        `${state.round.labA[axis].toFixed(1)} → ` +
        `${state.round.labB[axis].toFixed(1)} ` +
        `(${formatSigned(state.round.deltas[axis])})`;

      item.append(heading, values);
      return item;
    }),
  );

  elements.labA.textContent = formatLab(state.round.labA);
  elements.labB.textContent = formatLab(state.round.labB);
  elements.results.hidden = false;
  elements.submit.hidden = true;
  elements.answerProgress.textContent = "Answers submitted.";
  elements.liveResult.textContent =
    `${correctCount} of 3 correct. ` +
    `The comparison details are now available below.`;
  elements.results.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function submitAnswers(event) {
  event.preventDefault();
  if (state.submitted) return;

  const answers = selectedAnswers();
  if (AXES.some((axis) => answers[axis] === null)) return;

  state.submitted = true;
  const correctByAxis = Object.fromEntries(
    AXES.map((axis) => [axis, answers[axis] === state.round.correct[axis]]),
  );

  updateScore(correctByAxis);
  renderResults(answers, correctByAxis);
}

/**
 * Randomized development checks. Open the page with ?test=1 to run them.
 * A thrown error indicates an invariant failure; success is logged to console.
 */
function runGenerationChecks(iterations = 60) {
  const minimums = [1, 5, 20];
  let checked = 0;

  for (let maxAxes = 1; maxAxes <= 3; maxAxes += 1) {
    for (const minMagnitude of minimums) {
      for (let index = 0; index < iterations; index += 1) {
        const round = generateRound(maxAxes, minMagnitude);
        const changed = AXES.filter((axis) => round.deltas[axis] !== 0);

        if (changed.length < 1 || changed.length > maxAxes) {
          throw new Error("Changed-axis count is outside the configured bounds.");
        }

        for (const axis of AXES) {
          const delta = round.deltas[axis];
          const expected = directionForDelta(delta);

          if (!changed.includes(axis) && delta !== 0) {
            throw new Error("An unchanged axis received a non-zero delta.");
          }
          if (!changed.includes(axis) && round.correct[axis] !== "same") {
            throw new Error("An unchanged axis did not map to Same.");
          }
          if (changed.includes(axis) && Math.abs(delta) < minMagnitude) {
            throw new Error("A changed axis is below the minimum magnitude.");
          }
          if (round.correct[axis] !== expected) {
            throw new Error("A correct answer does not match its LAB delta.");
          }
        }

        for (const rgb of [round.rgbA, round.rgbB]) {
          for (const channel of ["r", "g", "b"]) {
            if (
              !Number.isFinite(rgb[channel]) ||
              rgb[channel] < 0 ||
              rgb[channel] > 255
            ) {
              throw new Error("Generated swatch has an invalid RGB channel.");
            }
          }
          if (!CSS.supports("color", rgb.css)) {
            throw new Error("Generated swatch has an invalid CSS color.");
          }
        }

        checked += 1;
      }
    }
  }

  console.info(`Color generation checks passed: ${checked} rounds.`);
  return checked;
}

elements.form.addEventListener("change", updateAnswerProgress);
elements.form.addEventListener("submit", submitAnswers);
elements.nextRound.addEventListener("click", renderNewRound);
elements.minDelta.addEventListener("input", () => {
  elements.minDeltaOutput.textContent = `${elements.minDelta.value} LAB units`;
});

renderNewRound();

if (new URLSearchParams(window.location.search).get("test") === "1") {
  runGenerationChecks();
}

window.ColorPerceptionGame = Object.freeze({
  labToSrgb,
  generateRound,
  directionForDelta,
  runGenerationChecks,
});
