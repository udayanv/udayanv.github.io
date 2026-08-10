# Shared widget files

Shared files are small, dependency-free, and opt-in. They provide consistency without coupling widget releases.

## Styles

- `styles/tokens.css` contains semantic design tokens and no component styles.
- `styles/base.css` contains a minimal reset and baseline rules for common HTML elements.

Load tokens before the base stylesheet, then load the widget’s local stylesheet. Local styles may override semantic tokens at `:root` for a justified widget-specific theme, but should reuse the shared spacing, typography, focus, and motion values where possible.

Changes here can affect every importing widget. Prefer additive changes, document renamed tokens, and verify all consumers before removing a token.

