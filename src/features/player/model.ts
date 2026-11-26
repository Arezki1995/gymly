import type { Dose, EquipmentId, Exercise, Session } from '../../content/schema';
import { hasEquipmentFor } from '../library/filter';

export type Side = 'L' | 'R';

export type PlayerItem = {
  block: string;
  /** The exercise being done (differs from the original after a swap). */
  exerciseId: string;
  originalExerciseId: string;
  sets: number;
  dose: Dose;
  unilateral: boolean;
  restSeconds: number;
  /** Completed sets; each side of a unilateral exercise counts as one set. */
  setsDone: number;
  skipped: boolean;
  /** Optional "Felt tight?" rating, 1 (loose) to 5 (very tight). */
  tightness?: number;
};

export type Step =
  | { kind: 'work'; item: number; set: number; side?: Side }
  | { kind: 'rest'; item: number; seconds: number };

export type PlayerState = {
  sessionId: string;
  programId?: string;
  items: PlayerItem[];
  steps: Step[];
  index: number;
  startedAt: number;
  endedAt?: number;
};

export type PlayerAction =
  | { type: 'complete'; at: number }
  | { type: 'skipExercise'; at: number }
  | { type: 'swap'; exercise: Exercise }
  | { type: 'rate'; item: number; value: number | undefined };

type GetExercise = (id: string) => Exercise | undefined;

/** Number of work steps an item has (each side of a unilateral exercise is one). */
export function workStepsFor(item: Pick<PlayerItem, 'sets' | 'unilateral'>): number {
  return item.sets * (item.unilateral ? 2 : 1);
}

/** Sets → sides, with a rest after each set except the last. Left always comes first. */
export function stepsForItem(itemIndex: number, item: PlayerItem): Step[] {
  const steps: Step[] = [];
  const sides: (Side | undefined)[] = item.unilateral ? ['L', 'R'] : [undefined];
  for (let set = 1; set <= item.sets; set++) {
    for (const side of sides) steps.push({ kind: 'work', item: itemIndex, set, side });
    if (set < item.sets && item.restSeconds > 0)
      steps.push({ kind: 'rest', item: itemIndex, seconds: item.restSeconds });
  }
  return steps;
}

function toItem(
  block: string,
  exercise: Exercise,
  originalExerciseId: string,
  sets: number,
  dose: Dose,
): PlayerItem {
  return {
    block,
    exerciseId: exercise.id,
    originalExerciseId,
    sets,
    dose,
    unilateral: exercise.unilateral,
    restSeconds: exercise.restSeconds,
    setsDone: 0,
    skipped: false,
  };
}

export function createPlayerState(
  session: Session,
  getExercise: GetExercise,
  startedAt: number,
  programId?: string,
): PlayerState {
  const items: PlayerItem[] = session.blocks.flatMap((block) =>
    block.items.map((it) => {
      const ex = getExercise(it.exerciseId);
      if (!ex) throw new Error(`Unknown exercise "${it.exerciseId}"`);
      return toItem(block.title, ex, ex.id, it.sets ?? ex.defaultSets, it.dose ?? ex.dose);
    }),
  );
  return {
    sessionId: session.id,
    programId,
    items,
    steps: items.flatMap((item, i) => stepsForItem(i, item)),
    index: 0,
    startedAt,
  };
}

export function currentStep(state: PlayerState): Step | undefined {
  return state.steps[state.index];
}

/** A swap is only offered before the first set of the current exercise is done. */
export function canSwap(state: PlayerState): boolean {
  const step = currentStep(state);
  return !!step && state.items[step.item]!.setsDone === 0;
}

/**
 * What the current exercise can be swapped for: the original exercise and its listed
 * alternatives, minus the one being done now, and only those the user has equipment for.
 */
export function swapOptions(
  state: PlayerState,
  getExercise: GetExercise,
  equipment: readonly EquipmentId[],
): Exercise[] {
  const step = currentStep(state);
  if (!step) return [];
  const { exerciseId, originalExerciseId } = state.items[step.item]!;
  const original = getExercise(originalExerciseId);
  if (!original) return [];
  return [original.id, ...(original.alternatives ?? [])]
    .filter((id) => id !== exerciseId)
    .map(getExercise)
    .filter((e): e is Exercise => !!e && hasEquipmentFor(e, equipment));
}

function goTo(state: PlayerState, index: number, at: number): PlayerState {
  return index >= state.steps.length
    ? { ...state, index: state.steps.length, endedAt: at }
    : { ...state, index };
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  if (state.endedAt !== undefined && action.type !== 'rate') return state;
  const step = currentStep(state);

  switch (action.type) {
    case 'complete': {
      if (!step) return state;
      let items = state.items;
      if (step.kind === 'work') {
        items = items.map((it, i) => (i === step.item ? { ...it, setsDone: it.setsDone + 1 } : it));
      }
      return goTo({ ...state, items }, state.index + 1, action.at);
    }

    case 'skipExercise': {
      if (!step) return state;
      const items = state.items.map((it, i) =>
        i === step.item && it.setsDone < workStepsFor(it) ? { ...it, skipped: true } : it,
      );
      const next = state.steps.findIndex((s, i) => i > state.index && s.item > step.item);
      return goTo({ ...state, items }, next === -1 ? state.steps.length : next, action.at);
    }

    case 'swap': {
      if (!step || !canSwap(state)) return state;
      const old = state.items[step.item]!;
      const swapped = toItem(
        old.block,
        action.exercise,
        old.originalExerciseId,
        old.sets,
        action.exercise.dose,
      );
      const items = state.items.map((it, i) => (i === step.item ? swapped : it));
      const before = state.steps.filter((s) => s.item < step.item);
      const after = state.steps.filter((s) => s.item > step.item);
      return {
        ...state,
        items,
        steps: [...before, ...stepsForItem(step.item, swapped), ...after],
        index: before.length,
      };
    }

    case 'rate': {
      const items = state.items.map((it, i) =>
        i === action.item ? { ...it, tightness: action.value } : it,
      );
      return { ...state, items };
    }
  }
}

export type SessionSummary = {
  durationSeconds: number;
  setsDone: number;
  totalSets: number;
  exercisesDone: number;
  exercisesSkipped: number;
  /** True when every exercise was completed without skipping. */
  allDone: boolean;
};

export function summarise(state: PlayerState): SessionSummary {
  const end = state.endedAt ?? state.startedAt;
  const skipped = state.items.filter((it) => it.skipped).length;
  return {
    durationSeconds: Math.max(0, Math.round((end - state.startedAt) / 1000)),
    setsDone: state.items.reduce((n, it) => n + it.setsDone, 0),
    totalSets: state.items.reduce((n, it) => n + workStepsFor(it), 0),
    exercisesDone: state.items.filter((it) => !it.skipped && it.setsDone >= workStepsFor(it))
      .length,
    exercisesSkipped: skipped,
    allDone: skipped === 0 && state.items.every((it) => it.setsDone >= workStepsFor(it)),
  };
}

/** Shape matches `sessionLogs` items in the brief (§7) so Phase 3 can persist it. */
export function toSessionLog(state: PlayerState, id: string) {
  return {
    id,
    sessionId: state.sessionId,
    programId: state.programId,
    startedAt: new Date(state.startedAt).toISOString(),
    endedAt: new Date(state.endedAt ?? state.startedAt).toISOString(),
    items: state.items.map((it) => ({
      exerciseId: it.exerciseId,
      setsDone: it.setsDone,
      skipped: it.skipped,
      ...(it.tightness !== undefined && { tightness: it.tightness }),
    })),
  };
}
