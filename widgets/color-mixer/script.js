const modeSelect = document.querySelector("#color-mode");
const controlsRegion = document.querySelector("#color-controls");
const sliders = [...document.querySelectorAll('.control input[type="range"]')];
const channelInputs = [...document.querySelectorAll(".channel-input")];
const channelLabels = sliders.map((_, index) => document.querySelector(`#channel-${index}-label`));
const channelUnits = sliders.map((_, index) => document.querySelector(`#channel-${index}-unit`));
const preview = document.querySelector("#color-preview");
const hexInput = document.querySelector("#hex-value");
const copyButton = document.querySelector("#copy-button");
const copyButtonLabel = copyButton.querySelector("span");
const copyStatus = document.querySelector("#copy-status");
const conversionHelpButton = document.querySelector("#open-conversion-help");
const conversionHelpDialog = document.querySelector("#conversion-help");
const conversionHelpClose = document.querySelector("#close-conversion-help");

const identity = (values) => ({ ...values });

const modes = {
    rgb: {
        name: "RGB",
        channels: [
            { key: "red", label: "Red", min: 0, max: 255, step: 1, unit: "", accent: "#ef4444" },
            { key: "green", label: "Green", min: 0, max: 255, step: 1, unit: "", accent: "#22a06b" },
            { key: "blue", label: "Blue", min: 0, max: 255, step: 1, unit: "", accent: "#3b82f6" }
        ],
        fromRgb: identity,
        toRgb: identity
    },
    ryb: {
        name: "RYB",
        channels: [
            { key: "red", label: "Red", min: 0, max: 255, step: 1, unit: "", accent: "#ef4444" },
            { key: "yellow", label: "Yellow", min: 0, max: 255, step: 1, unit: "", accent: "#eab308" },
            { key: "blue", label: "Blue", min: 0, max: 255, step: 1, unit: "", accent: "#3b82f6" }
        ],
        fromRgb: ColorConversions.rgbToRyb,
        toRgb: ColorConversions.rybToRgb
    },
    hvc: {
        name: "HVC",
        channels: [
            { key: "hue", label: "Hue", min: 0, max: 360, step: 1, unit: "°", accent: "#8b5cf6" },
            { key: "value", label: "Value", min: 0, max: 100, step: 1, unit: "%", accent: "#64748b" },
            { key: "chroma", label: "Chroma", min: 0, max: 100, step: 1, unit: "%", accent: "#ec4899" }
        ],
        fromRgb: ColorConversions.rgbToHvc,
        toRgb: ColorConversions.hvcToRgb
    }
};

let activeModeKey = "rgb";
let activeValues = {};
let currentRgb = { red: 99, green: 102, blue: 241 };
let currentHex = "#6366F1";

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Math.round(Number(value))));
}

function toHex(value) {
    return clamp(value, 0, 255).toString(16).padStart(2, "0").toUpperCase();
}

function parseHex(value) {
    const match = value.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);

    if (!match) {
        return null;
    }

    const digits = match[1].length === 3
        ? [...match[1]].map((digit) => digit + digit).join("")
        : match[1];

    return {
        red: parseInt(digits.slice(0, 2), 16),
        green: parseInt(digits.slice(2, 4), 16),
        blue: parseInt(digits.slice(4, 6), 16)
    };
}

function getChannelMaximum(channel) {
    if (activeModeKey === "hvc" && channel.key === "chroma") {
        return clamp(activeValues.value, 0, 100);
    }

    return channel.max;
}

function normalizeActiveValues() {
    const mode = modes[activeModeKey];

    mode.channels.forEach((channel) => {
        const maximum = getChannelMaximum(channel);
        activeValues[channel.key] = clamp(activeValues[channel.key], channel.min, maximum);
    });
}

function updateControlValue(index) {
    const channel = modes[activeModeKey].channels[index];
    const maximum = getChannelMaximum(channel);
    const value = activeValues[channel.key];

    sliders[index].max = maximum;
    channelInputs[index].max = maximum;
    sliders[index].value = value;
    channelInputs[index].value = value;
    sliders[index].style.setProperty(
        "--fill",
        `${maximum === channel.min ? 0 : ((value - channel.min) / (maximum - channel.min)) * 100}%`
    );
}

function renderControls() {
    const mode = modes[activeModeKey];
    controlsRegion.setAttribute("aria-label", `${mode.name} color controls`);

    mode.channels.forEach((channel, index) => {
        channelLabels[index].textContent = channel.label;
        channelUnits[index].textContent = channel.unit;

        sliders[index].min = channel.min;
        sliders[index].step = channel.step;
        sliders[index].style.setProperty("--track-color", channel.accent);

        channelInputs[index].min = channel.min;
        channelInputs[index].step = channel.step;
        channelInputs[index].setAttribute("aria-label", `${channel.label} value`);
    });

    normalizeActiveValues();
    mode.channels.forEach((_, index) => updateControlValue(index));
}

function syncControlsFromRgb() {
    activeValues = modes[activeModeKey].fromRgb(currentRgb);
    renderControls();
}

function renderPreview(updateHexInput = true) {
    currentRgb = {
        red: clamp(currentRgb.red, 0, 255),
        green: clamp(currentRgb.green, 0, 255),
        blue: clamp(currentRgb.blue, 0, 255)
    };
    currentHex = `#${toHex(currentRgb.red)}${toHex(currentRgb.green)}${toHex(currentRgb.blue)}`;

    preview.style.backgroundColor = `rgb(${currentRgb.red}, ${currentRgb.green}, ${currentRgb.blue})`;
    preview.setAttribute("aria-label", `Color preview for ${currentHex}`);

    if (updateHexInput) {
        hexInput.value = currentHex;
    }

    hexInput.setAttribute("aria-invalid", "false");
    copyButtonLabel.textContent = "Copy";
    copyStatus.textContent = "";
}

function applyActiveValues() {
    normalizeActiveValues();
    modes[activeModeKey].channels.forEach((_, index) => updateControlValue(index));
    currentRgb = modes[activeModeKey].toRgb(activeValues);
    renderPreview();
}

modeSelect.addEventListener("change", () => {
    activeModeKey = modeSelect.value;
    syncControlsFromRgb();
    copyButtonLabel.textContent = "Copy";
    copyStatus.textContent = "";
});

sliders.forEach((slider, index) => {
    slider.addEventListener("input", () => {
        const channel = modes[activeModeKey].channels[index];
        activeValues[channel.key] = Number(slider.value);
        applyActiveValues();
    });
});

channelInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
        const channel = modes[activeModeKey].channels[index];
        const maximum = getChannelMaximum(channel);
        const value = Number(input.value);

        if (input.value !== "" && value >= channel.min && value <= maximum) {
            activeValues[channel.key] = value;
            applyActiveValues();
        }
    });

    input.addEventListener("change", () => {
        const channel = modes[activeModeKey].channels[index];
        const maximum = getChannelMaximum(channel);
        const fallback = activeValues[channel.key];

        activeValues[channel.key] = input.value === ""
            ? fallback
            : clamp(input.value, channel.min, maximum);
        applyActiveValues();
    });
});

hexInput.addEventListener("input", () => {
    const color = parseHex(hexInput.value);

    if (color) {
        currentRgb = color;
        renderPreview(false);
        syncControlsFromRgb();
    } else {
        hexInput.setAttribute("aria-invalid", "true");
    }
});

hexInput.addEventListener("change", () => {
    const color = parseHex(hexInput.value);

    if (color) {
        currentRgb = color;
        renderPreview();
        syncControlsFromRgb();
    } else {
        hexInput.value = currentHex;
        hexInput.setAttribute("aria-invalid", "false");
        copyStatus.textContent = "Enter a 3 or 6 digit hex color.";
    }
});

async function copyColor() {
    try {
        await navigator.clipboard.writeText(currentHex);
        copyButtonLabel.textContent = "Copied";
        copyStatus.textContent = `${currentHex} copied to clipboard.`;
    } catch {
        const textArea = document.createElement("textarea");
        textArea.value = currentHex;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();

        const copied = document.execCommand("copy");
        textArea.remove();

        copyButtonLabel.textContent = copied ? "Copied" : "Try again";
        copyStatus.textContent = copied
            ? `${currentHex} copied to clipboard.`
            : `Unable to copy ${currentHex}.`;
    }
}

copyButton.addEventListener("click", copyColor);

conversionHelpButton.addEventListener("click", () => {
    conversionHelpDialog.showModal();
});

conversionHelpClose.addEventListener("click", () => {
    conversionHelpDialog.close();
});

conversionHelpDialog.addEventListener("click", (event) => {
    if (event.target === conversionHelpDialog) {
        conversionHelpDialog.close();
    }
});

conversionHelpDialog.addEventListener("close", () => {
    conversionHelpButton.focus();
});

syncControlsFromRgb();
renderPreview();
