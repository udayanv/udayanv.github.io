# Widgets

A collection of small, independently deployable web tools and experiments. Each widget owns its source and runtime; the top-level files provide the catalog, shared design guidance, and a starter for new widgets.

## Current structure

```text
widgets/
├── .editorconfig              Text-formatting defaults
├── .gitignore                 Shared generated-file exclusions
├── index.html                 Widget catalog
├── index.css                  Catalog-specific styles
├── widgets.json               Source of truth for widget metadata
├── widgets.schema.json        Registry schema
├── scripts/                   Repository maintenance scripts
├── DESIGN.md                  Shared product and interface guidance
├── shared/
│   ├── README.md              How to consume shared files
│   └── styles/
│       ├── tokens.css         Shared design tokens
│       └── base.css           Optional baseline element styles
├── widget-template/           Copy-ready zero-build starter
├── color-game/                Legacy CIELAB comparison game
├── color-perception-trainer/  React color perception trainer
├── color-game-v2/             Compatibility redirect for the former URL
├── color-mixer/               Zero-build color conversion tool
└── ratio-guesser/             Static aspect-ratio perception trainer
```

## Widget catalog

<!-- widgets:table:start -->
| Widget | Status | Stack | Entry point |
| --- | --- | --- | --- |
| [Color Perception Trainer](color-perception-trainer/) | Active | React, TypeScript, Vite | `color-perception-trainer/src/main.tsx` |
| [Color Mixer](color-mixer/) | Available | HTML, CSS, JavaScript | `color-mixer/index.html` |
| [Color Perception Game](color-game/) | Available, legacy | HTML, CSS, JavaScript | `color-game/index.html` |
| [Ratio Guesser](ratio-guesser/) | Available | HTML, CSS, JavaScript | `ratio-guesser/index.html` |
<!-- widgets:table:end -->

“Legacy” describes the first implementation, not a broken or deprecated URL. The trainer is the newer, broader successor.

## Adding a widget

For a small browser-only tool:

1. Copy `widget-template/` to a lowercase kebab-case directory.
2. Replace the starter copy and metadata.
3. Follow [DESIGN.md](DESIGN.md), importing the shared tokens before local styles.
4. Keep widget-specific code, assets, and documentation inside its directory.
5. Add its metadata to `widgets.json` and run `node scripts/sync-widget-catalog.mjs`.
6. Confirm the generated README table and catalog entry are correct.
7. Confirm the widget works from its directory path, not only from `/`.

Use a dedicated toolchain only when the widget needs one. A toolchain-based widget should include its own manifest, lockfile, build instructions, and ignore rules, as `color-perception-trainer/` does.

## Repository conventions

- Every widget directory has a `README.md` describing purpose, status, entry point, local development, and notable architecture.
- A runnable static widget uses `index.html` as its public entry point.
- Shared files are opt-in. Import them explicitly; do not make one widget’s build a prerequisite for another.
- Widget-specific decisions stay local. Cross-widget decisions belong in `DESIGN.md` or `shared/`.
- Generated dependencies and build output are not source. Ignore `node_modules/`, package-manager stores, `dist/`, and compiler build-info files.
- Historical material belongs under a clearly named archive directory and should not be treated as current guidance.

## Local development

Static widgets can be opened directly, but a local HTTP server catches path and module issues more reliably. From `widgets/`, use any static server you already have available.

The React trainer has its own commands; see [color-perception-trainer/README.md](color-perception-trainer/README.md).

## Deployment

The repository’s GitHub Pages workflow tests and builds `color-perception-trainer/`, builds the surrounding Jekyll site, then replaces that app’s source directory in the published artifact with its compiled output. The other widgets and this catalog are published as static files. `color-game-v2/` remains a lightweight redirect for old links.
