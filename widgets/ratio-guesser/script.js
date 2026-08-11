"use strict";

const RATIO_MIN = 0.4;
const RATIO_MAX = 2.5;
const TARGET_LOCAL_WIDTH_MIN = 110;
const TARGET_LOCAL_WIDTH_MAX = 210;
const USER_LOCAL_WIDTH = 120;
const MIN_REPEAT_GRID_DISTANCE = 2;

const DIFFICULTY_MAX_TERMS = Object.freeze({
  easy: 5,
  medium: 8,
  hard: 12,
});

const RESULT_BANDS = Object.freeze([
  { maximum: 2, label: "Excellent" },
  { maximum: 5, label: "Very close" },
  { maximum: 10, label: "Close" },
  { maximum: Number.POSITIVE_INFINITY, label: "Keep calibrating" },
]);

const COLORS = Object.freeze({
  target: "#2f5848",
  user: "#b96336",
  userOverlay: "rgba(210, 116, 67, 0.34)",
  userOutline: "#9a4f29",
});

function greatestCommonDivisor(first, second) {
  let a = first;
  let b = second;

  while (b !== 0) {
    [a, b] = [b, a % b];
  }

  return a;
}

function createNaturalRatioGrid(maximumTerm) {
  const ratios = [];

  for (let numerator = 1; numerator <= maximumTerm; numerator += 1) {
    for (let denominator = 1; denominator <= maximumTerm; denominator += 1) {
      const value = numerator / denominator;
      if (
        greatestCommonDivisor(numerator, denominator) === 1
        && value >= RATIO_MIN
        && value <= RATIO_MAX
      ) {
        ratios.push(Object.freeze({ numerator, denominator, value }));
      }
    }
  }

  ratios.sort((first, second) => first.value - second.value);
  return Object.freeze(ratios);
}

const RATIO_GRIDS = Object.freeze(Object.fromEntries(
  Object.entries(DIFFICULTY_MAX_TERMS).map(([difficulty, maximumTerm]) => [
    difficulty,
    createNaturalRatioGrid(maximumTerm),
  ]),
));

function rectangleGeometry({ width, height }) {
  return Object.freeze({ width, height });
}

function plusGeometry({ width, height }) {
  return Object.freeze({
    width,
    height,
    verticalBarWidth: width * 0.24,
    horizontalBarHeight: width * 0.24,
  });
}

function withLocalTransform(context, geometry, rotationDegrees, drawPath) {
  context.save();
  context.rotate((rotationDegrees * Math.PI) / 180);
  context.beginPath();
  drawPath(context, geometry);
  context.restore();
}

const SHAPE_DEFINITIONS = Object.freeze({
  rectangle: Object.freeze({
    id: "rectangle",
    label: "Rectangle",
    createGeometry: rectangleGeometry,
    draw(context, { geometry, rotationDegrees = 0 }) {
      withLocalTransform(context, geometry, rotationDegrees, (drawingContext, shape) => {
        drawingContext.rect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
      });
    },
  }),
  plus: Object.freeze({
    id: "plus",
    label: "Plus sign",
    createGeometry: plusGeometry,
    draw(context, { geometry, rotationDegrees = 0 }) {
      withLocalTransform(context, geometry, rotationDegrees, (drawingContext, shape) => {
        drawingContext.rect(
          -shape.verticalBarWidth / 2,
          -shape.height / 2,
          shape.verticalBarWidth,
          shape.height,
        );
        drawingContext.rect(
          -shape.width / 2,
          -shape.horizontalBarHeight / 2,
          shape.width,
          shape.horizontalBarHeight,
        );
      });
    },
  }),
});

const elements = {
  targetObject: document.querySelector("#target-object"),
  userObject: document.querySelector("#user-object"),
  difficulty: document.querySelector("#difficulty"),
  slider: document.querySelector("#ratio-slider"),
  ratioValue: document.querySelector("#ratio-value"),
  targetCanvas: document.querySelector("#target-canvas"),
  userCanvas: document.querySelector("#user-canvas"),
  submitButton: document.querySelector("#submit-button"),
  nextButton: document.querySelector("#next-button"),
  result: document.querySelector("#result"),
  resultLabel: document.querySelector("#result-label"),
  targetScore: document.querySelector("#target-score"),
  userScore: document.querySelector("#user-score"),
  errorScore: document.querySelector("#error-score"),
  comparisonCanvas: document.querySelector("#comparison-canvas"),
};

const previousTargetIndices = new Map();

const state = {
  selectedTargetObject: elements.targetObject.value,
  selectedUserObject: elements.userObject.value,
  difficulty: elements.difficulty.value,
  round: null,
  estimateRatioIndex: 0,
  estimateRatio: 1,
  submitted: false,
};

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}

function randomIndex(length) {
  return Math.floor(randomBetween(0, length));
}

function getRatioGrid(difficulty = state.difficulty) {
  return RATIO_GRIDS[difficulty];
}

function getEstimateRatioDefinition() {
  return getRatioGrid()[state.estimateRatioIndex];
}

function formatRatioDefinition(ratioDefinition) {
  return `${ratioDefinition.value.toFixed(2)} · ${ratioDefinition.numerator}:${ratioDefinition.denominator}`;
}

function generateTargetRatioDefinition(objectId, difficulty) {
  const grid = getRatioGrid(difficulty);
  const historyKey = `${objectId}:${difficulty}`;
  const previousIndex = previousTargetIndices.get(historyKey);
  let index;
  let attempts = 0;

  do {
    index = randomIndex(grid.length);
    attempts += 1;
  } while (
    previousIndex !== undefined
    && Math.abs(index - previousIndex) < MIN_REPEAT_GRID_DISTANCE
    && attempts < 24
  );

  previousTargetIndices.set(historyKey, index);
  return grid[index];
}

function generateRound(objectId, difficulty) {
  const definition = SHAPE_DEFINITIONS[objectId];
  const ratioDefinition = generateTargetRatioDefinition(objectId, difficulty);
  const generatedWidth = Math.round(randomBetween(TARGET_LOCAL_WIDTH_MIN, TARGET_LOCAL_WIDTH_MAX));
  const geometry = definition.createGeometry({
    width: generatedWidth,
    height: generatedWidth * ratioDefinition.value,
  });

  return Object.freeze({
    objectId,
    localWidth: geometry.width,
    localHeight: geometry.height,
    rotationDegrees: 0,
    ratioDefinition,
    geometry,
  });
}

function getTargetRatio() {
  return state.round.localHeight / state.round.localWidth;
}

function getUserGeometry() {
  return SHAPE_DEFINITIONS[state.selectedUserObject].createGeometry({
    width: USER_LOCAL_WIDTH,
    height: USER_LOCAL_WIDTH * state.estimateRatio,
  });
}

function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const pixelWidth = Math.round(width * scale);
  const pixelHeight = Math.round(height * scale);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  const context = canvas.getContext("2d");
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.clearRect(0, 0, width, height);
  return { context, width, height };
}

function drawShape(context, definition, geometry, options = {}) {
  context.save();
  context.translate(options.centerX, options.centerY);
  context.scale(options.scale ?? 1, options.scale ?? 1);
  context.fillStyle = options.fillStyle;
  context.strokeStyle = options.strokeStyle ?? "transparent";
  context.lineWidth = options.lineWidth ?? 0;
  definition.draw(context, {
    geometry,
    rotationDegrees: options.rotationDegrees ?? 0,
  });
  context.fill(options.fillRule ?? "nonzero");
  if (options.lineWidth) {
    context.stroke();
  }
  context.restore();
}

function fitScale(geometry, canvasWidth, canvasHeight, padding) {
  return Math.min(
    (canvasWidth - padding * 2) / geometry.width,
    (canvasHeight - padding * 2) / geometry.height,
  );
}

function drawTarget() {
  const { context, width, height } = fitCanvas(elements.targetCanvas);
  const definition = SHAPE_DEFINITIONS[state.round.objectId];
  const scale = Math.min(
    1,
    fitScale(state.round.geometry, width, height, Math.min(width, height) * 0.13),
  );

  drawShape(context, definition, state.round.geometry, {
    centerX: width / 2,
    centerY: height / 2,
    scale,
    fillStyle: COLORS.target,
    rotationDegrees: state.round.rotationDegrees,
  });
}

function drawUser() {
  const { context, width, height } = fitCanvas(elements.userCanvas);
  const definition = SHAPE_DEFINITIONS[state.selectedUserObject];
  const geometry = getUserGeometry();
  const responsiveFixedWidth = Math.min(USER_LOCAL_WIDTH, width * 0.42, (height - 48) / RATIO_MAX);
  const scale = responsiveFixedWidth / USER_LOCAL_WIDTH;

  drawShape(context, definition, geometry, {
    centerX: width / 2,
    centerY: height / 2,
    scale,
    fillStyle: COLORS.user,
  });
}

function drawComparison() {
  const { context, width, height } = fitCanvas(elements.comparisonCanvas);
  const targetDefinition = SHAPE_DEFINITIONS[state.round.objectId];
  const userDefinition = SHAPE_DEFINITIONS[state.selectedUserObject];
  const normalizedWidth = Math.min(112, width * 0.38, (height - 42) / RATIO_MAX);
  const targetGeometry = targetDefinition.createGeometry({
    width: normalizedWidth,
    height: normalizedWidth * getTargetRatio(),
  });
  const userGeometry = userDefinition.createGeometry({
    width: normalizedWidth,
    height: normalizedWidth * state.estimateRatio,
  });

  drawShape(context, targetDefinition, targetGeometry, {
    centerX: width / 2,
    centerY: height / 2,
    fillStyle: COLORS.target,
    rotationDegrees: state.round.rotationDegrees,
  });
  drawShape(context, userDefinition, userGeometry, {
    centerX: width / 2,
    centerY: height / 2,
    fillStyle: COLORS.userOverlay,
    strokeStyle: COLORS.userOutline,
    lineWidth: 3,
  });
}

function updateCanvasLabels() {
  const targetLabel = SHAPE_DEFINITIONS[state.round.objectId].label;
  const userLabel = SHAPE_DEFINITIONS[state.selectedUserObject].label;
  const targetRatioDefinition = state.round.ratioDefinition;
  const estimateRatioDefinition = getEstimateRatioDefinition();
  elements.targetCanvas.setAttribute(
    "aria-label",
    state.submitted
      ? `Reference shape: ${targetLabel}. Target height-to-width ratio ${targetRatioDefinition.value.toFixed(2)}, ${targetRatioDefinition.numerator} to ${targetRatioDefinition.denominator}.`
      : `Reference shape: ${targetLabel}. Estimate its height-to-width ratio.`,
  );
  elements.userCanvas.setAttribute(
    "aria-label",
    `${userLabel} estimate with height-to-width ratio ${estimateRatioDefinition.value.toFixed(2)}, ${estimateRatioDefinition.numerator} to ${estimateRatioDefinition.denominator}.`,
  );
}

function updateRatioValue() {
  const ratioDefinition = getEstimateRatioDefinition();
  const formattedRatio = formatRatioDefinition(ratioDefinition);
  elements.ratioValue.value = formattedRatio;
  elements.ratioValue.textContent = formattedRatio;
  elements.slider.setAttribute(
    "aria-valuetext",
    `${ratioDefinition.value.toFixed(2)}, ratio ${ratioDefinition.numerator} to ${ratioDefinition.denominator}`,
  );
}

function updateDebugSnapshot() {
  document.documentElement.dataset.ratioGuesserRound = JSON.stringify({
    targetObject: state.selectedTargetObject,
    userObject: state.selectedUserObject,
    difficulty: state.difficulty,
    localWidth: state.round.localWidth,
    localHeight: state.round.localHeight,
    targetRatio: getTargetRatio(),
    targetFraction: `${state.round.ratioDefinition.numerator}/${state.round.ratioDefinition.denominator}`,
    rotationDegrees: state.round.rotationDegrees,
    estimateRatioIndex: state.estimateRatioIndex,
    estimateRatio: state.estimateRatio,
    estimateFraction: `${getEstimateRatioDefinition().numerator}/${getEstimateRatioDefinition().denominator}`,
    gridLength: getRatioGrid().length,
    userWidth: getUserGeometry().width,
    userHeight: getUserGeometry().height,
    submitted: state.submitted,
  });
}

function renderAnsweringState() {
  elements.slider.disabled = false;
  elements.submitButton.hidden = false;
  elements.nextButton.hidden = true;
  elements.result.hidden = true;
  updateRatioValue();
  updateCanvasLabels();
  updateDebugSnapshot();
  drawTarget();
  drawUser();
}

function startRound() {
  const grid = getRatioGrid();
  const squareIndex = grid.findIndex((ratioDefinition) => (
    ratioDefinition.numerator === 1 && ratioDefinition.denominator === 1
  ));
  state.round = generateRound(state.selectedTargetObject, state.difficulty);
  state.estimateRatioIndex = squareIndex;
  state.estimateRatio = grid[squareIndex].value;
  state.submitted = false;
  elements.slider.min = "0";
  elements.slider.max = String(grid.length - 1);
  elements.slider.step = "1";
  elements.slider.value = String(squareIndex);
  renderAnsweringState();
}

function scoreRound() {
  const targetRatio = getTargetRatio();
  const relativeErrorPercent = (Math.abs(targetRatio - state.estimateRatio) / targetRatio) * 100;
  const logError = Math.abs(Math.log(state.estimateRatio / targetRatio));
  const qualitativeResult = RESULT_BANDS.find((band) => relativeErrorPercent <= band.maximum).label;

  return Object.freeze({ targetRatio, relativeErrorPercent, logError, qualitativeResult });
}

function submitEstimate() {
  if (state.submitted) return;

  state.submitted = true;
  const score = scoreRound();
  const targetRatioDefinition = state.round.ratioDefinition;
  const estimateRatioDefinition = getEstimateRatioDefinition();
  elements.slider.disabled = true;
  elements.submitButton.hidden = true;
  elements.nextButton.hidden = false;
  elements.resultLabel.textContent = score.qualitativeResult;
  elements.targetScore.textContent = `H ÷ W = ${formatRatioDefinition(targetRatioDefinition)}`;
  elements.userScore.textContent = `H ÷ W = ${formatRatioDefinition(estimateRatioDefinition)}`;
  elements.errorScore.textContent = `${score.relativeErrorPercent.toFixed(1)}%`;
  elements.result.hidden = false;
  elements.comparisonCanvas.setAttribute(
    "aria-label",
    `Overlay comparison. Target ratio ${targetRatioDefinition.value.toFixed(2)}, ${targetRatioDefinition.numerator} to ${targetRatioDefinition.denominator}. Your ratio ${estimateRatioDefinition.value.toFixed(2)}, ${estimateRatioDefinition.numerator} to ${estimateRatioDefinition.denominator}. Relative error ${score.relativeErrorPercent.toFixed(1)} percent.`,
  );
  updateCanvasLabels();
  updateDebugSnapshot();
  drawComparison();
  elements.nextButton.focus();

  window.dispatchEvent(new CustomEvent("ratio-guesser:submitted", {
    detail: { ...score, estimateRatio: state.estimateRatio },
  }));
}

function handleSettingsChange() {
  state.selectedTargetObject = elements.targetObject.value;
  state.selectedUserObject = elements.userObject.value;
  state.difficulty = elements.difficulty.value;
  startRound();
}

elements.targetObject.addEventListener("change", handleSettingsChange);
elements.userObject.addEventListener("change", handleSettingsChange);
elements.difficulty.addEventListener("change", handleSettingsChange);
function updateEstimateFromSlider() {
  state.estimateRatioIndex = Number(elements.slider.value);
  state.estimateRatio = getEstimateRatioDefinition().value;
  updateRatioValue();
  updateCanvasLabels();
  updateDebugSnapshot();
  drawUser();
}

elements.slider.addEventListener("input", updateEstimateFromSlider);
elements.slider.addEventListener("keydown", (event) => {
  const directionByKey = {
    ArrowLeft: -1,
    ArrowDown: -1,
    ArrowRight: 1,
    ArrowUp: 1,
  };
  const direction = directionByKey[event.key];

  if (!direction) return;

  event.preventDefault();
  const nextIndex = Math.min(
    getRatioGrid().length - 1,
    Math.max(0, state.estimateRatioIndex + direction),
  );
  elements.slider.value = String(nextIndex);
  updateEstimateFromSlider();
});
elements.submitButton.addEventListener("click", submitEstimate);
elements.nextButton.addEventListener("click", startRound);

const resizeObserver = new ResizeObserver(() => {
  if (!state.round) return;
  drawTarget();
  drawUser();
  if (state.submitted) drawComparison();
});

resizeObserver.observe(elements.targetCanvas);
resizeObserver.observe(elements.userCanvas);
resizeObserver.observe(elements.comparisonCanvas);

window.ratioGuesserDebug = Object.freeze({
  getState() {
    return {
      ...state,
      targetRatio: state.round ? getTargetRatio() : null,
      userGeometry: state.round ? getUserGeometry() : null,
    };
  },
  shapeDefinitions: SHAPE_DEFINITIONS,
  ratioGrids: RATIO_GRIDS,
});

startRound();
