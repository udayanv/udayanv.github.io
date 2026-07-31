Read and follow the [design document](designDoc-v2.md) as the authoritative project plan. Do not modify any files inside ArchivedDocs.

Build the R1 Color Perception Trainer page in this repository. Implement the complete beginner-friendly free-play experience specified in the plan:

- A polished responsive home/exercise-selection screen
- Relative Shift as the only playable exercise
- Separate Lightness and Chroma choices
- Procedurally generated, objectively scored two-swatch questions
- Immediate educational feedback
- An always-available pop-out Palette Reference with the six preset primaries
- LocalStorage progress tracked separately for Lightness and Chroma
- Accessible keyboard and touch controls
- Conservative sRGB-safe rendering and clear visual distinctions

Follow the modular architecture and implementation order in the design document. Keep domain color/exercise logic independent of React and browser persistence. Reserve data-driven space in the exercise selector for the future Hidden Undertone and Mix a Color exercises, but do not implement them yet.

First inspect the repository and any existing project conventions. Then implement the page, run relevant checks/tests, and summarize the files changed and any remaining limitations.