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

## Phase 1

- **exercises.json:** valid as supplied. No fixes were needed and no exercises were added.
- **Missing exercises in two programs:** the brief's _Joint Health Daily_ mentions ankle CARs and _Warm-up Primer_ mentions band/cable pull-aparts. Neither is in exercises.json, so instead of inventing new ones the programs use `knee-to-wall` (ankles) and `face-pull-er` (light cable pull, 2 × 12). Add proper exercises later if wanted.
- **Joint Health Daily / Warm-up Primer** are "ongoing" in the brief, but the schema needs a length: they're modelled as 4-week blocks (7×/week and 3×/week) with `add-reps` every 4 weeks. Restarting the block is how they continue.
- **Progression rules:** Rotator Reset `add-set`, Overhead Unlock `add-seconds`, Hip Opener `level-up`, each every 2 weeks (as the brief lists).
- **Level-3 exercises** (`kb-arm-bar`, `copenhagen-plank`) are not in any program: the brief unlocks them through the Silver skill-tree tier (Phase 5).
- **Assessments:** a `scoreLabels` field was added to the measure schema so score tests (wall flexion, Thomas test) can show what each score means. Range targets from the brief were set as: shoulder IR 65°, hip IR 40°, hip ER 45°. Apley scratch is filed under the `shoulder-ir` goal (lower is better, target 0 cm); the side logged is the arm that goes over the top. The Thomas test logs the hanging leg.
- **Strict schemas:** content objects reject unknown keys, so a typo in a field name fails validation instead of being silently ignored.
- **Build-time validation:** a small Vite plugin runs the same `validateContent()` as the tests, so `npm run build` and `npm run dev` fail on broken content.
- **Library filters** live in the URL (`#/library?area=hip&eq=mat`) so they survive opening an exercise and going back. "Equipment I have" is a manual chip picker for now; Phase 3 will default it to the Settings equipment checklist. Search matches name, cues, area, type and goal ids.
- **Programs tab** shows a simple read-only list now that programs.json exists; the detail view and Start button come in Phase 2.
