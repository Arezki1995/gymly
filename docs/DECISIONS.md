# Decisions

Small calls made where the brief was open. Newest last.

## Phase 0

- **Name:** the app is called **Gymly** (the brief and CLAUDE.md originally said "Mobility Quest"). The persisted-state key is `gymly`.
- **File layout:** `BRIEF.md` moved to `docs/BRIEF.md` and `exercises.json` to `src/content/exercises.json`, as CLAUDE.md expects. The duplicate `BRIEF_1.md` (byte-identical) was removed; the original zip is kept but git-ignored.
- **Versions:** React 18 as required. TypeScript is pinned to 6.0 because `typescript-eslint` does not support TypeScript 7 yet. Tailwind 4 (Vite plugin, no `tailwind.config.js`). ESLint 9 flat config.
- **Base path:** Vite `base: './'` so the same build works on a GitHub Pages project URL (`/<repo>/`) or any other static host; HashRouter handles routing.
- **Dark mode:** follows the system setting via Tailwind's default `prefers-color-scheme` variant for now. The manual theme toggle comes with Settings in Phase 3.
- **Icons:** generated placeholder icons (green "G"); a proper icon is part of Phase 6.
- **Lint script:** `npm run lint` runs ESLint and `prettier --check`. User-supplied files (`docs/BRIEF.md`, `CLAUDE.md`, `exercises.json`) are excluded from Prettier so their content isn't rewritten.
