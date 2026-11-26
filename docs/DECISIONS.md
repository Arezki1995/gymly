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

## Phase 2

- **Step order:** for each set, Left then Right (unilateral), then a rest of the exercise's `restSeconds`. No rest after an exercise's last set; the next exercise just appears. Rep steps and the first hold of an exercise wait for a tap, so there's time to walk to the next station.
- **Hold flow:** the first hold of an exercise waits for "Start hold", then a 5-second "Get ready" countdown, then the hold. Later sets and the second side start the get-ready countdown on their own ("Switch sides"). When a hold ends the player beeps/buzzes and moves on by itself. Pause, Resume and an early Done are available.
- **Each side is one set** in the counts ("25 / 25 sets"), matching the XP rule in §6.
- **Swap** is offered only before the first set of the current exercise. Options are the original exercise plus its listed `alternatives`, minus the one being done, filtered to the user's equipment. The swapped-in exercise keeps the session's set count but uses its own dose.
- **Equipment until Phase 3:** swaps assume a typical Basic-Fit club (everything except the bring-your-own band and the dowel, `src/lib/equipment.ts`). Phase 3 replaces this with the Settings checklist.
- **Sound/vibration** is a bell toggle in the player header for now; it moves to Settings in Phase 3. Beeps are generated with Web Audio (no sound files). iOS Safari has no Vibration API, so iPhones only get the beep.
- **Timers** run on wall-clock timestamps, not tick counting, so they stay right when the phone throttles a background tab. Rests keep running if you switch apps.
- **Wake lock** is re-requested whenever the page becomes visible again. Where the API is missing, the header shows "keep your screen on".
- **Progression** (`progression` in programs.json) isn't applied yet: it needs the program start date, which arrives with the persisted store in Phase 3.
- **Not saved yet:** the player builds a log in the §7 `sessionLogs` shape (`toSessionLog`), but nothing is stored until Phase 3. Leaving mid-session asks for confirmation. XP and badges on the end screen come in Phase 5.
- **Session log items** are one entry per exercise, with `setsDone` counting both sides (no per-side `side` entries).
