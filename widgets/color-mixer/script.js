const sliders = {
    red: document.querySelector("#red"),
    green: document.querySelector("#green"),
    blue: document.querySelector("#blue")
};

const channelInputs = {
    red: document.querySelector("#red-value"),
    green: document.querySelector("#green-value"),
    blue: document.querySelector("#blue-value")
};

const preview = document.querySelector("#color-preview");
const hexInput = document.querySelector("#hex-value");
const copyButton = document.querySelector("#copy-button");
const copyButtonLabel = copyButton.querySelector("span");
const copyStatus = document.querySelector("#copy-status");

let currentHex = "#6366F1";

function toHex(value) {
    return Number(value).toString(16).padStart(2, "0").toUpperCase();
}

function clampChannel(value) {
    return Math.min(255, Math.max(0, Math.round(Number(value))));
}

function renderColor(red, green, blue, updateHexInput = true) {
    const channels = {
        red: clampChannel(red),
        green: clampChannel(green),
        blue: clampChannel(blue)
    };

    currentHex = `#${toHex(channels.red)}${toHex(channels.green)}${toHex(channels.blue)}`;

    Object.keys(channels).forEach((channel) => {
        const value = channels[channel];
        sliders[channel].value = value;
        channelInputs[channel].value = value;
        sliders[channel].style.setProperty("--fill", `${(value / 255) * 100}%`);
    });

    preview.style.backgroundColor = `rgb(${channels.red}, ${channels.green}, ${channels.blue})`;
    preview.setAttribute("aria-label", `Color preview for ${currentHex}`);

    if (updateHexInput) {
        hexInput.value = currentHex;
    }

    hexInput.setAttribute("aria-invalid", "false");
    copyButtonLabel.textContent = "Copy";
    copyStatus.textContent = "";
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

Object.keys(sliders).forEach((channel) => {
    sliders[channel].addEventListener("input", () => {
        renderColor(sliders.red.value, sliders.green.value, sliders.blue.value);
    });

    channelInputs[channel].addEventListener("input", () => {
        const value = Number(channelInputs[channel].value);

        if (channelInputs[channel].value !== "" && value >= 0 && value <= 255) {
            renderColor(
                channel === "red" ? value : sliders.red.value,
                channel === "green" ? value : sliders.green.value,
                channel === "blue" ? value : sliders.blue.value
            );
        }
    });

    channelInputs[channel].addEventListener("change", () => {
        const fallback = sliders[channel].value;
        const value = channelInputs[channel].value === ""
            ? fallback
            : clampChannel(channelInputs[channel].value);

        renderColor(
            channel === "red" ? value : sliders.red.value,
            channel === "green" ? value : sliders.green.value,
            channel === "blue" ? value : sliders.blue.value
        );
    });
});

hexInput.addEventListener("input", () => {
    const color = parseHex(hexInput.value);

    if (color) {
        renderColor(color.red, color.green, color.blue, false);
    } else {
        hexInput.setAttribute("aria-invalid", "true");
    }
});

hexInput.addEventListener("change", () => {
    const color = parseHex(hexInput.value);

    if (color) {
        renderColor(color.red, color.green, color.blue);
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
renderColor(99, 102, 241);
