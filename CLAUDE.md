# CLAUDE.md — Gymly

Project rules for the coding agent. The full product spec and phased plan live in `docs/BRIEF.md`; read it before starting any phase.

## What this is
A mobile-first, static React web app (PWA) for gym mobility training, focused on shoulder rotation (internal/external), shoulder overhead mobility, hip mobility and joint health. Built for a Basic-Fit member, so every exercise must use equipment found in a typical Basic-Fit club (or no equipment). Progress is gamified (XP, levels, streaks, badges, quests).

## Tech stack (do not change without asking)
- Vite + React 18 + TypeScript (strict mode)
- React Router with `HashRouter` (works on any static host, including GitHub Pages)
- Tailwind CSS for styling
- Zustand with the `persist` middleware for state, saved to `localStorage`
- Zod to validate all content files at build time and in tests
- `vite-plugin-pwa` for offline use and "Add to Home Screen"
- Vitest + React Testing Library for tests
- ESLint + Prettier
- No backend, no accounts, no analytics, no paid APIs

## Architecture rules
- **Content is data, not code.** Exercises, programs, assessments, badges and quests live in `src/content/*.json`. Adding a new exercise must never need a component change.
- Every content file has a Zod schema in `src/content/schema.ts`. A test loads every content file and fails on schema errors or broken references (e.g. a program pointing at a missing exercise id).
- Game rules (XP, levels, streaks, badge checks) are **pure functions** in `src/game/` with unit tests. Components never compute XP themselves.
- Persisted state has a `version` number and a `migrate` function. Never break a user's saved history.
- Folders: `src/content`, `src/game`, `src/store`, `src/features/<feature>`, `src/components` (shared UI), `src/lib` (helpers).

## Mobile-first UI rules
- Design for a 360–430 px wide screen first; desktop is a centred column (max-width ~480 px).
- Touch targets at least 44×44 px. Primary actions sit in the bottom third of the screen (thumb reach).
- Bottom tab bar navigation: Today · Programs · Library · Progress · Settings.
- During a session: large timer, large Next/Done buttons, keep the screen awake (Wake Lock API with graceful fallback), optional vibration and beep at the end of holds/rests.
- Support dark mode (default to system setting). Respect `prefers-reduced-motion`.
- Works offline once loaded.

## Safety content rules
- The app shows a one-time disclaimer: it is not medical advice; stop on sharp pain; see a professional for injuries.
- Every exercise has `cautions`. Stretch intensity guidance: mild discomfort is OK (≤ 3/10), pain is not.
- Do not invent new exercises outside `src/content/exercises.json` without listing them in the PR/commit message for review.

## Working style
- Work one phase at a time from `docs/BRIEF.md`. At the end of each phase: `npm run lint`, `npm run test`, `npm run build` must all pass.
- Commit after each completed task with a clear message.
- If a requirement is ambiguous, pick the simplest option that fits these rules and note it in `docs/DECISIONS.md`.
