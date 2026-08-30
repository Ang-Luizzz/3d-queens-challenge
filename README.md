# 3D Queens Challenge

Interactive browser puzzle for placing the maximum number of non-attacking queens in 3D chess spaces.

## Current puzzle sizes

Fixed sizes:

- 3×3×3
- 4×4×4
- 5×5×5
- 6×6×6

Custom dimensions are also supported from 3 through 6 on each axis (`X×Y×Z`).

The game runs entirely in the browser with no backend.

## Development

The source repository deploys automatically from `main` to GitHub Pages through `.github/workflows/pages.yml`.

The original inline engine in `index.html` is currently superseded at runtime by `size-engine.js` before the remaining enhancement scripts initialize. Do not assume the inline 3/4/5 implementation represents the published behavior.

## Project continuity

The project has grown beyond the original single queens puzzle. Detailed product decisions, architecture, history, current behavior, mathematical research, Knight-mode exploration, technical debt, and roadmap are maintained in:

**[PROJECT_STATE.md](./PROJECT_STATE.md)**

Read that document before making structural changes or continuing the multi-mode roadmap.
