(function () {
    "use strict";

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, Number(value)));
    }

    function normalizeRgb(rgb) {
        return {
            red: clamp(rgb.red, 0, 255) / 255,
            green: clamp(rgb.green, 0, 255) / 255,
            blue: clamp(rgb.blue, 0, 255) / 255
        };
    }

    function scaleRgb(rgb) {
        return {
            red: Math.round(clamp(rgb.red, 0, 1) * 255),
            green: Math.round(clamp(rgb.green, 0, 1) * 255),
            blue: Math.round(clamp(rgb.blue, 0, 1) * 255)
        };
    }

    function rgbToRyb(rgb) {
        let { red, green, blue } = normalizeRgb(rgb);
        const white = Math.min(red, green, blue);

        red -= white;
        green -= white;
        blue -= white;

        const maxGreen = Math.max(red, green, blue);
        let yellow = Math.min(red, green);

        red -= yellow;
        green -= yellow;

        if (blue > 0 && green > 0) {
            blue /= 2;
            green /= 2;
        }

        yellow += green;
        blue += green;

        const maxYellow = Math.max(red, yellow, blue);
        if (maxYellow > 0) {
            const scale = maxGreen / maxYellow;
            red *= scale;
            yellow *= scale;
            blue *= scale;
        }

        return {
            red: Math.round((red + white) * 255),
            yellow: Math.round((yellow + white) * 255),
            blue: Math.round((blue + white) * 255)
        };
    }

    function rybToRgb(ryb) {
        let red = clamp(ryb.red, 0, 255) / 255;
        let yellow = clamp(ryb.yellow, 0, 255) / 255;
        let blue = clamp(ryb.blue, 0, 255) / 255;
        const white = Math.min(red, yellow, blue);

        red -= white;
        yellow -= white;
        blue -= white;

        const maxYellow = Math.max(red, yellow, blue);
        let green = Math.min(yellow, blue);

        yellow -= green;
        blue -= green;

        if (blue > 0 && green > 0) {
            blue *= 2;
            green *= 2;
        }

        red += yellow;
        green += yellow;

        const maxGreen = Math.max(red, green, blue);
        if (maxGreen > 0) {
            const scale = maxYellow / maxGreen;
            red *= scale;
            green *= scale;
            blue *= scale;
        }

        return scaleRgb({
            red: red + white,
            green: green + white,
            blue: blue + white
        });
    }

    function rgbToHvc(rgb) {
        const { red, green, blue } = normalizeRgb(rgb);
        const value = Math.max(red, green, blue);
        const minimum = Math.min(red, green, blue);
        const chroma = value - minimum;
        let hue = 0;

        if (chroma > 0) {
            if (value === red) {
                hue = 60 * (((green - blue) / chroma) % 6);
            } else if (value === green) {
                hue = 60 * ((blue - red) / chroma + 2);
            } else {
                hue = 60 * ((red - green) / chroma + 4);
            }
        }

        if (hue < 0) {
            hue += 360;
        }

        return {
            hue: Math.round(hue),
            value: Math.round(value * 100),
            chroma: Math.round(chroma * 100)
        };
    }

    function hvcToRgb(hvc) {
        const hue = ((Number(hvc.hue) % 360) + 360) % 360;
        const value = clamp(hvc.value, 0, 100) / 100;
        const chroma = Math.min(clamp(hvc.chroma, 0, 100) / 100, value);
        const hueSection = hue / 60;
        const secondary = chroma * (1 - Math.abs((hueSection % 2) - 1));
        let red = 0;
        let green = 0;
        let blue = 0;

        if (hueSection < 1) {
            red = chroma;
            green = secondary;
        } else if (hueSection < 2) {
            red = secondary;
            green = chroma;
        } else if (hueSection < 3) {
            green = chroma;
            blue = secondary;
        } else if (hueSection < 4) {
            green = secondary;
            blue = chroma;
        } else if (hueSection < 5) {
            red = secondary;
            blue = chroma;
        } else {
            red = chroma;
            blue = secondary;
        }

        const minimum = value - chroma;
        return scaleRgb({
            red: red + minimum,
            green: green + minimum,
            blue: blue + minimum
        });
    }

    window.ColorConversions = Object.freeze({
        rgbToRyb,
        rybToRgb,
        rgbToHvc,
        hvcToRgb
    });
}());
