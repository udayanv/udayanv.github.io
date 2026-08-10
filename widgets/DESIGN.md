# Widget design guide

This guide is the default for new widgets and for substantial revisions to existing ones. It creates a recognizable family without requiring every tool to have the same layout.

## Product principles

1. **Start with the task.** The first screen should explain what the widget does and expose its primary action.
2. **Keep interaction local.** A widget should not require accounts, navigation chrome, or unrelated site context unless its task truly needs them.
3. **Prefer understandable controls.** Use native buttons, inputs, selects, and dialogs before custom equivalents.
4. **Show state clearly.** Loading, empty, error, success, disabled, and unavailable states should be explicit in both text and appearance.
5. **Work at the directory URL.** Relative asset paths must survive GitHub Pages subdirectory hosting.

## Shared visual foundation

`shared/styles/tokens.css` defines the common vocabulary: color, typography, spacing, radii, shadows, motion, content width, and focus treatment. `shared/styles/base.css` provides an optional reset and accessible element defaults.

New static widgets should load styles in this order:

```html
<link rel="stylesheet" href="../shared/styles/tokens.css">
<link rel="stylesheet" href="../shared/styles/base.css">
<link rel="stylesheet" href="styles.css">
```

The first two files are stable shared inputs. Keep component and layout rules in the widget’s own stylesheet. Existing widgets may migrate when they are next redesigned; adopting the tokens should not be a cosmetic search-and-replace.

## Visual direction

- Use warm, quiet surfaces and dark neutral text as the default canvas.
- Reserve the green accent for primary actions, selected states, and small moments of emphasis.
- Let content and interactive examples provide most of the color; avoid decorative gradients that compete with the tool.
- Prefer one strong page title, short supporting copy, and clear sectional hierarchy.
- Use borders and spacing before adding shadows. Shadows are for overlays or genuinely elevated surfaces.

## Layout and responsive behavior

- Design from a 320px-wide viewport upward.
- Keep the main reading and interaction area within `--widget-content-max`.
- Use the shared spacing scale; introduce a local value only when the interaction demands it.
- Avoid fixed heights for text-bearing containers.
- Allow controls to wrap or stack before labels truncate.
- Keep primary actions near the state they affect.

## Interaction and accessibility

- All functionality must be usable with a keyboard.
- Visible controls should have a minimum 44-by-44 CSS-pixel target where practical.
- Use `:focus-visible` and the shared focus token; never remove focus without a replacement.
- Do not rely on color alone for status or correctness.
- Associate labels and help text with controls programmatically.
- Announce asynchronous results through an appropriate live region.
- Respect `prefers-reduced-motion`; motion should explain change, not decorate idle screens.
- Meet WCAG AA contrast for text and essential interface graphics.

## Content conventions

- Name the task in plain language before introducing specialist vocabulary.
- Buttons describe the action: “Copy color,” “Check answer,” or “Next round.”
- Error messages state what happened and what the user can do next.
- Mark experiments, local-only storage, approximations, and unfinished features honestly.

## Definition of done

A new widget is ready to add to the catalog when it has:

- a useful page title and description;
- a local `README.md`;
- keyboard and touch support for its core task;
- layouts checked at narrow and wide widths;
- explicit empty, error, and completion states where applicable;
- no dependency on an absolute root URL;
- an entry in the top-level README and catalog.

