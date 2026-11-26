# Gymly — Product Brief & Build Plan

> Hand this file (plus `CLAUDE.md` and `src/content/exercises.json`) to Claude Code. Build one phase at a time. Each phase ends with a ready-to-paste prompt.

---

## 1. Product summary

**Gymly** is a phone-first web app I use at the gym (Basic-Fit) to follow mobility sessions and track progress over time.

**Focus areas**
1. **Shoulder rotation** — internal rotation (IR) and external rotation (ER), rotator cuff control.
2. **Shoulder overhead mobility** — flexion, thoracic extension, scapular control, lats/pecs.
3. **Hip mobility** — hip IR/ER, flexion (deep squat), extension (hip flexors), adductors.
4. **Joint health** — controlled articular rotations (CARs) for shoulders, hips, spine, ankles.

**Core loop:** take a quick self-test → follow a program session in the gym → log sets/holds → earn XP and unlock levels → retest every 4 weeks and watch the numbers improve.

**Non-goals (for now):** accounts, cloud sync, social features, video hosting, nutrition, strength programming.

---

## 2. Equipment model (Basic-Fit)

Basic-Fit clubs have strength, free-weight, functional and stretch zones, but the exact kit varies by club. The app therefore has an **"My club has…" checklist in Settings**, and the library/session player filters or swaps exercises based on it.

| id | Label | Typical location |
|---|---|---|
| `none` | Bodyweight only | anywhere |
| `mat` | Exercise mat | stretch / functional zone |
| `foam_roller` | Foam roller | stretch zone |
| `dumbbell` | Dumbbells (light) | free-weight zone |
| `kettlebell` | Kettlebell | functional / free-weight zone |
| `cable` | Cable station (adjustable pulley) + D-handle / rope / ankle strap | strength zone |
| `bench` | Flat/adjustable bench | free-weight zone |
| `box` | Plyo box / step | functional zone |
| `pullup_bar` | Pull-up bar / rig | functional zone |
| `wall` | Wall or upright | anywhere |
| `band` | Resistance band (**bring your own** — not guaranteed) | — |
| `dowel` | Light bar / dowel / body bar (**may not exist**) | functional zone |

Every exercise lists `equipment` (all required) and optional `alternatives` (exercise ids to swap in when equipment is missing).

---

## 3. Content data model

All content lives in `src/content/`. Schemas in `src/content/schema.ts` (Zod). TypeScript types are inferred from the schemas.

```ts
// exercises.json
type Exercise = {
  id: string;                    // kebab-case, stable forever
  name: string;
  area: 'shoulder' | 'hip' | 'thoracic' | 'ankle' | 'full-body';
  goals: Goal[];                 // e.g. ['shoulder-er', 'shoulder-ir']
  type: 'stretch' | 'active-mobility' | 'strength-mobility' | 'cars' | 'soft-tissue';
  equipment: EquipmentId[];
  level: 1 | 2 | 3;              // 1 beginner, 3 advanced
  unilateral: boolean;           // true → player runs Left then Right
  dose: { kind: 'reps'; reps: number } | { kind: 'hold'; seconds: number };
  defaultSets: number;
  restSeconds: number;
  cues: string[];                // 2–4 short coaching cues
  cautions: string[];
  alternatives?: string[];       // exercise ids
  videoUrl?: string;             // optional, user-added link
};

type Goal =
  | 'shoulder-er' | 'shoulder-ir' | 'shoulder-flexion' | 'scapular-control'
  | 'thoracic-rotation' | 'thoracic-extension'
  | 'hip-er' | 'hip-ir' | 'hip-flexion' | 'hip-extension' | 'hip-adduction'
  | 'ankle-dorsiflexion' | 'joint-health';

// programs.json
type Program = {
  id: string;
  name: string;
  description: string;
  goals: Goal[];
  weeks: number;                 // e.g. 4
  sessionsPerWeek: number;       // e.g. 3
  sessions: Session[];           // rotated A/B/C
  progression: { everyWeeks: number; rule: 'add-set' | 'add-seconds' | 'add-reps' | 'level-up' };
};
type Session = {
  id: string; name: string; estMinutes: number;
  blocks: { title: string; items: { exerciseId: string; sets?: number; dose?: Exercise['dose'] }[] }[];
};

// assessments.json
type Assessment = {
  id: string; name: string; goal: Goal;
  instructions: string[];
  measure: { kind: 'degrees' | 'cm' | 'seconds' | 'score'; min: number; max: number; higherIsBetter: boolean; target?: number };
  unilateral: boolean;
};

// badges.json & quests.json — see §6
```

A content test must check: valid schemas, unique ids, every referenced id exists, every exercise has at least one cue and one caution.

---

## 4. Seed content

### 4.1 Exercises
A reviewed seed list is in `src/content/exercises.json` (~30 exercises across shoulders, thoracic spine, hips, ankles). Use it as-is; don't silently add new ones.

### 4.2 Programs (create in `programs.json`)

| Program | Goals | Format | Example session A |
|---|---|---|---|
| **Rotator Reset** | shoulder-er, shoulder-ir, scapular-control | 4 wks × 3/wk, ~25 min | Shoulder CARs → Cable ER at 0° → Cable IR at 0° → Side-lying DB ER → Sleeper stretch → Face pull with ER |
| **Overhead Unlock** | shoulder-flexion, thoracic-extension | 4 wks × 2/wk, ~20 min | Foam-roller T-spine extension → Open book → Bench lat stretch → Wall slides → Prone Y-T-W → Dead hang |
| **Hip Opener** | hip-ir, hip-er, hip-flexion, hip-extension | 4 wks × 3/wk, ~25 min | Hip CARs → 90/90 switches → 90/90 IR lift-offs → Couch stretch → Goblet squat pry → Cossack squat |
| **Joint Health Daily** | joint-health | ongoing, 10 min | Neck-free full-body CARs: shoulders, spine (cat-cow), hips, ankles |
| **Warm-up Primer** | mix | before any lifting, 8 min | Cat-cow → Thread the needle → World's greatest stretch → Hip CARs → Band/cable pull-aparts |

Each program gets 2–3 sessions (A/B/C) so weeks don't feel repetitive. Progression every 2 weeks: +1 set, or +10 s on holds, or swap to the level-2 variant.

### 4.3 Self-tests (create in `assessments.json`)

| id | Test | Measure | Rough target |
|---|---|---|---|
| `shoulder-er-90` | Lying on back, arm out at 90°, elbow bent 90°, let the hand fall back | degrees (estimate with on-screen angle picker) | ≥ 90° |
| `shoulder-ir-90` | Same position, rotate hand forward/down without the shoulder lifting | degrees | ≥ 60–70° |
| `apley-scratch` | Reach one hand over the shoulder, the other up the back; distance between fingertips | cm (negative = overlap) | ≤ 0 cm |
| `wall-flexion` | Back flat to wall, raise straight arms overhead | score 0–3 (can't reach / touches with arch / touches flat / easy) | 3 |
| `hip-ir-seated` | Seated on bench, knee at 90°, swing foot out | degrees | ≥ 35–40° |
| `hip-er-seated` | Same, swing foot in | degrees | ≥ 40–45° |
| `deep-squat-hold` | Heels down, bodyweight deep squat | seconds | ≥ 60 s |
| `thomas-test` | Lie at end of bench, hug one knee, does the other thigh stay flat? | score 0–2 | 2 |
| `knee-to-wall` | Kneeling lunge, max toe-to-wall distance with knee touching, heel down | cm | ≥ 10 cm |

**Angle picker UX:** a semicircle with a draggable handle and three reference illustrations (simple SVG line drawings made in-app, not copied images). Self-estimates are fine; consistency matters more than precision.

---

## 5. Screens

1. **Onboarding (first launch)** — disclaimer → pick focus areas → equipment checklist → optional baseline self-tests → suggested program.
2. **Today** — streak flame, XP bar + level, "Next session" card with Start button, active quest progress.
3. **Programs** — list of programs, progress ring per program, detail view with weeks/sessions.
4. **Library** — searchable exercise list, filters (area, goal, equipment I have, level). Exercise detail: cues, cautions, dose, equipment chips, alternatives.
5. **Session player** — the most important screen:
   - One exercise per screen, big name, current set "2 / 3", side "Left / Right".
   - Hold exercises: big countdown ring, auto-advances. Rep exercises: rep target + "Done" button.
   - Rest timer between sets with skip/+15 s.
   - "Swap" button → alternatives (respecting equipment).
   - "Felt tight?" quick rating 1–5 per exercise (optional) for future suggestions.
   - Wake lock on; vibration/beep at timer end (toggle in Settings).
   - End screen: time spent, XP earned, badges unlocked, confetti (respect reduced motion).
6. **Progress** — streak calendar (heatmap), XP history, line chart per self-test over time, Left vs Right comparison for unilateral tests, "skill tree" view (§6).
7. **Settings** — equipment checklist, sound/vibration, theme, units, **Export / Import data (JSON file)**, reset.

---

## 6. Gamification rules

All rules are pure functions in `src/game/` with unit tests.

**XP**
- +10 XP per completed set (each side counts as a set for unilateral).
- +50 XP for completing a full session; +25 bonus if all items done without skipping.
- +100 XP for logging a full self-test retest.
- +20 XP × improvement steps when a self-test beats the previous best (e.g. +5° or +2 cm = 1 step).

**Levels:** level *n* needs `100 × n^1.5` cumulative XP (rounded). Show titles: 1 Stiff Starter · 5 Loosening Up · 10 Mobile · 15 Supple · 20 Fluid · 30 Mobility Master.

**Streaks:** count **weeks** where the weekly target (from the active program, default 2 sessions) is met — weekly streaks suit gym life better than daily ones. One "freeze" token earned every 4-week streak, auto-used if a week is missed.

**Skill tree (per focus area):** nodes = goals (e.g. Shoulder ER). Each node has 3 tiers unlocked by **real self-test milestones**, not just XP:
- Shoulder ER: Bronze 70° · Silver 80° · Gold 90°+
- Shoulder IR: Bronze 45° · Silver 55° · Gold 65°+
- Hip IR: Bronze 25° · Silver 32° · Gold 40°+
- Deep squat: Bronze 20 s · Silver 45 s · Gold 90 s
- Unlocking Silver on a node unlocks level-3 exercises for that goal.

**Badges (`badges.json`)** — declarative conditions evaluated by one engine, e.g.:
`first-session`, `ten-sessions`, `both-sides-balanced` (L/R test results within 5%), `program-complete`, `retest-hero` (3 retests), `streak-4`, `streak-12`, `cuff-commander` (Gold on shoulder ER and IR), `hip-hinge-hero` (Gold on hip IR and ER).

```ts
type BadgeCondition =
  | { kind: 'sessions-completed'; count: number }
  | { kind: 'streak-weeks'; count: number }
  | { kind: 'program-completed'; programId?: string }
  | { kind: 'assessment-at-least'; assessmentId: string; value: number; side?: 'both' }
  | { kind: 'sides-balanced'; assessmentId: string; tolerancePct: number }
  | { kind: 'all-of'; conditions: BadgeCondition[] };
```

**Quests (`quests.json`)** — goal-based missions spanning weeks, e.g. "Unlock 90° external rotation in 8 weeks": auto-assigns a program, sets a retest reminder every 4 weeks, shows a progress bar from baseline to target. This is how custom goal-driven programs plug in later.

---

## 7. State & persistence

Zustand store persisted to `localStorage` under key `gymly`, with `version` + `migrate`.

```ts
type AppState = {
  version: number;
  profile: { focusAreas: string[]; equipment: EquipmentId[]; onboarded: boolean; settings: {...} };
  activeProgram?: { programId: string; startedAt: string; sessionIndex: number };
  sessionLogs: { id; sessionId; programId?; startedAt; endedAt; items: { exerciseId; side?; setsDone; skipped; tightness? }[] }[];
  assessmentResults: { assessmentId; date; side?: 'L' | 'R'; value }[];
  xpEvents: { date; amount; reason }[];      // XP is derived from events, never stored as a single number
  unlockedBadges: { badgeId; date }[];
  activeQuests: { questId; startedAt; baseline: number }[];
};
```

Export = download the full state as JSON. Import = validate with Zod, then replace.

---

## 8. Build plan for Claude Code

Paste each prompt into Claude Code in order. Review and test on your phone after each phase.

### Phase 0 — Scaffold
**Tasks:** Vite + React + TS strict; Tailwind; React Router (HashRouter); Zustand; Zod; ESLint/Prettier; Vitest; vite-plugin-pwa with manifest & icons placeholder; bottom tab layout with 5 empty screens; GitHub Actions workflow to deploy `dist/` to GitHub Pages.
**Done when:** `npm run dev` shows the tab bar on a phone-sized viewport; lint/test/build pass.
> **Prompt:** "Read CLAUDE.md and docs/BRIEF.md. Do Phase 0 only: scaffold the project with the exact stack in CLAUDE.md, create the five-tab mobile layout with empty screens, set up PWA and a GitHub Pages deploy workflow. Make sure lint, test and build pass, then commit."

### Phase 1 — Content & Library
**Tasks:** Zod schemas (§3); load `exercises.json`; write `programs.json` and `assessments.json` from §4; content integrity test; Library screen with search + filters; Exercise detail page.
**Done when:** all seed exercises browse and filter correctly; content test catches a deliberately broken id.
> **Prompt:** "Do Phase 1 from docs/BRIEF.md: content schemas, the content integrity test, programs.json and assessments.json from section 4, and the Library + Exercise detail screens. Don't change exercises.json content except to fix schema errors, and list any fixes."

### Phase 2 — Session player
**Tasks:** Program detail → Start session; player per §5.5 (sets, sides, hold countdown, rep Done, rest timer, swap, skip); wake lock; vibration/beep; end screen.
**Done when:** a full "Rotator Reset A" session can be completed on a phone with the screen never sleeping.
> **Prompt:** "Do Phase 2 from docs/BRIEF.md: build the session player exactly as in section 5, item 5. Put timer logic in a tested hook. Equipment-aware Swap must only offer alternatives I have equipment for."

### Phase 3 — Persistence, history & onboarding
**Tasks:** Zustand persisted store (§7) with versioning; save session logs; onboarding flow; Settings (equipment checklist, sound, theme); export/import JSON.
**Done when:** reloading the page keeps everything; export → reset → import restores state.
> **Prompt:** "Do Phase 3 from docs/BRIEF.md: the persisted store with version + migrate, session logging, onboarding, Settings, and JSON export/import validated with Zod. Add tests for migrate and import validation."

### Phase 4 — Self-tests & Progress
**Tasks:** assessment flow with angle picker / number input / score; L/R capture; Progress screen with line charts (use a light library like Recharts or hand-rolled SVG), streak calendar heatmap.
**Done when:** I can log a baseline, log a retest, and see the change.
> **Prompt:** "Do Phase 4 from docs/BRIEF.md: self-test flow with the angle picker, Left/Right capture, and the Progress screen with per-test charts and a weekly streak calendar."

### Phase 5 — Gamification
**Tasks:** `src/game/` pure functions: XP from events, levels, weekly streak + freezes, badge engine, skill-tree tiers, level-3 unlocks; `badges.json`, `quests.json`; Today screen with XP bar, streak, quest; end-of-session rewards.
**Done when:** unit tests cover every rule in §6; finishing a session visibly awards XP and badges.
> **Prompt:** "Do Phase 5 from docs/BRIEF.md: implement every gamification rule in section 6 as pure, unit-tested functions in src/game, then wire them into Today, the session end screen and the skill-tree view on Progress."

### Phase 6 — Polish & ship
**Tasks:** offline test, Lighthouse PWA/accessibility pass (≥ 90), dark mode check, reduced motion, empty states, app icon, deploy.
> **Prompt:** "Do Phase 6 from docs/BRIEF.md: polish, accessibility and offline checks, fix anything Lighthouse flags under 90, then deploy to GitHub Pages and give me the URL."

### Phase 7 (later) — Program builder & goal quests
**Tasks:** build-your-own program from the library (drag to reorder, set dose); quest creator: pick a self-test + target + weeks → app proposes a program and retest schedule.

---

## 9. Maintenance notes
- **Add an exercise:** append to `exercises.json`, run `npm test`. No code change.
- **Add a program/badge/quest:** same — JSON only.
- **Change XP balance:** edit constants in `src/game/config.ts`.
- **Hosting:** GitHub Pages (free); Netlify or Cloudflare Pages also work because it's a plain static build.
