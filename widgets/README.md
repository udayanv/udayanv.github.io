# Widgets

A collection of small, independently deployable web tools and experiments. Each widget owns its source and runtime; the top-level files provide the catalog, shared design guidance, and a starter for new widgets.

## Current structure

```text
widgets/
├── .editorconfig              Text-formatting defaults
├── .gitignore                 Shared generated-file exclusions
├── index.html                 Widget catalog
├── index.css                  Catalog-specific styles
├── DESIGN.md                  Shared product and interface guidance
├── shared/
│   ├── README.md              How to consume shared files
│   └── styles/
│       ├── tokens.css         Shared design tokens
│       └── base.css           Optional baseline element styles
├── widget-template/           Copy-ready zero-build starter
├── color-game/                Legacy CIELAB comparison game
├── color-game-v2/             React color perception trainer
├── color-mixer/               Zero-build color conversion tool
└── ratio-guesser/             Planned widget; documentation only
```

## Widget catalog

| Widget | Status | Stack | Entry point |
| --- | --- | --- | --- |
| [Color Perception Game](color-game/) | Available, legacy | HTML, CSS, JavaScript | `color-game/index.html` |
| [Color Perception Trainer](color-game-v2/) | Active | React, TypeScript, Vite | `color-game-v2/src/main.tsx` |
| [Color Mixer](color-mixer/) | Available | HTML, CSS, JavaScript | `color-mixer/index.html` |
| [Ratio Guesser](ratio-guesser/) | Planned | Not selected | No runnable entry point |

“Legacy” describes the first implementation, not a broken or deprecated URL. The trainer is the newer, broader successor.

## Adding a widget

For a small browser-only tool:

1. Copy `widget-template/` to a lowercase kebab-case directory.
2. Replace the starter copy and metadata.
3. Follow [DESIGN.md](DESIGN.md), importing the shared tokens before local styles.
4. Keep widget-specific code, assets, and documentation inside its directory.
5. Add the widget to the table above and to the catalog in `index.html`.
6. Confirm the widget works from its directory path, not only from `/`.

Use a dedicated toolchain only when the widget needs one. A toolchain-based widget should include its own manifest, lockfile, build instructions, and ignore rules, as `color-game-v2/` does.

## Repository conventions

- Every widget directory has a `README.md` describing purpose, status, entry point, local development, and notable architecture.
- A runnable static widget uses `index.html` as its public entry point.
- Shared files are opt-in. Import them explicitly; do not make one widget’s build a prerequisite for another.
- Widget-specific decisions stay local. Cross-widget decisions belong in `DESIGN.md` or `shared/`.
- Generated dependencies and build output are not source. Ignore `node_modules/`, package-manager stores, `dist/`, and compiler build-info files.
- Historical material belongs under a clearly named archive directory and should not be treated as current guidance.

## Local development

Static widgets can be opened directly, but a local HTTP server catches path and module issues more reliably. From `widgets/`, use any static server you already have available.

The React trainer has its own commands; see [color-game-v2/README.md](color-game-v2/README.md).

## Deployment

The repository’s GitHub Pages workflow tests and builds `color-game-v2/`, builds the surrounding Jekyll site, then replaces that app’s source directory in the published artifact with its compiled output. The other widgets and this catalog are published as static files.
