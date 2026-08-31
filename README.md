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

The project has grown beyond the original single queens puzzle. To continue development in another conversation or with another agent, read these files in this order:

1. **[LATEST_STATUS.md](./LATEST_STATUS.md)** — changes made after the last approved handoff; currently records the hybrid turntable rotation pending visual validation.
2. **[CURRENT_HANDOFF.md](./CURRENT_HANDOFF.md)** — latest fully approved state and exact roadmap position before the pending change.
3. **[PROJECT_STATE.md](./PROJECT_STATE.md)** — full history, product decisions, architecture, mathematical research, Knight-mode exploration, technical debt, roadmap, and earlier conclusions.

Precedence is `LATEST_STATUS.md` → `CURRENT_HANDOFF.md` → `PROJECT_STATE.md` when they differ.

Then review the current `main` branch before making structural changes.
