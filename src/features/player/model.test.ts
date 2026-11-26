import { getExercise, programs } from '../../content';
import type { Session } from '../../content/schema';
import {
  canSwap,
  createPlayerState,
  currentStep,
  playerReducer,
  summarise,
  swapOptions,
  toSessionLog,
  type PlayerState,
} from './model';

const T0 = Date.UTC(2026, 10, 26, 18, 0, 0);
const rotatorA = programs[0]!.sessions[0]!;

const session = (items: Session['blocks'][number]['items']): Session => ({
  id: 'test',
  name: 'Test',
  estMinutes: 5,
  blocks: [{ title: 'Block', items }],
});

const start = (s: Session) => createPlayerState(s, getExercise, T0, 'p');
const complete = (s: PlayerState, at = T0) => playerReducer(s, { type: 'complete', at });
const completeAll = (s: PlayerState, at = T0) => {
  while (s.endedAt === undefined) s = complete(s, at);
  return s;
};

describe('createPlayerState', () => {
  it('runs Left then Right each set, with a rest between sets but not after the last', () => {
    // cable-er-0: unilateral, 3 sets, 45 s rest
    const s = start(session([{ exerciseId: 'cable-er-0' }]));
    expect(s.steps).toEqual([
      { kind: 'work', item: 0, set: 1, side: 'L' },
      { kind: 'work', item: 0, set: 1, side: 'R' },
      { kind: 'rest', item: 0, seconds: 45 },
      { kind: 'work', item: 0, set: 2, side: 'L' },
      { kind: 'work', item: 0, set: 2, side: 'R' },
      { kind: 'rest', item: 0, seconds: 45 },
      { kind: 'work', item: 0, set: 3, side: 'L' },
      { kind: 'work', item: 0, set: 3, side: 'R' },
    ]);
  });

  it('applies session overrides for sets and dose', () => {
    const s = start(
      session([{ exerciseId: 'face-pull-er', sets: 1, dose: { kind: 'reps', reps: 5 } }]),
    );
    expect(s.items[0]).toMatchObject({ sets: 1, dose: { kind: 'reps', reps: 5 } });
    expect(s.steps).toEqual([{ kind: 'work', item: 0, set: 1, side: undefined }]);
  });

  it('builds the whole Rotator Reset A session', () => {
    const s = start(rotatorA);
    expect(s.items.map((i) => i.exerciseId)).toEqual([
      'shoulder-cars',
      'cable-er-0',
      'cable-ir-0',
      'side-lying-db-er',
      'sleeper-stretch',
      'face-pull-er',
    ]);
    expect(summarise(s).totalSets).toBe(2 + 6 + 6 + 4 + 4 + 3);
  });
});

describe('playerReducer', () => {
  it('counts each completed work step as a set and ends after the last step', () => {
    let s = start(rotatorA);
    s = completeAll(s, T0 + 25 * 60_000);
    const sum = summarise(s);
    expect(sum).toEqual({
      durationSeconds: 25 * 60,
      setsDone: 25,
      totalSets: 25,
      exercisesDone: 6,
      exercisesSkipped: 0,
      allDone: true,
    });
    expect(currentStep(s)).toBeUndefined();
  });

  it('skipping an exercise jumps to the next one and marks it skipped', () => {
    let s = start(session([{ exerciseId: 'cable-er-0' }, { exerciseId: 'dead-hang' }]));
    s = complete(s); // set 1 L
    s = playerReducer(s, { type: 'skipExercise', at: T0 });
    expect(currentStep(s)).toEqual({ kind: 'work', item: 1, set: 1, side: undefined });
    expect(s.items[0]).toMatchObject({ setsDone: 1, skipped: true });
    s = completeAll(s);
    expect(summarise(s)).toMatchObject({ exercisesDone: 1, exercisesSkipped: 1, allDone: false });
  });

  it('skipping the last exercise ends the session', () => {
    let s = start(session([{ exerciseId: 'dead-hang' }]));
    s = playerReducer(s, { type: 'skipExercise', at: T0 + 1000 });
    expect(s.endedAt).toBe(T0 + 1000);
  });

  it('swaps the current exercise before its first set, keeping the set count', () => {
    let s = start(session([{ exerciseId: 'shoulder-cars' }, { exerciseId: 'cable-er-0' }]));
    s = complete(complete(s)); // shoulder CARs L + R
    expect(currentStep(s)).toMatchObject({ item: 1, set: 1, side: 'L' });
    expect(canSwap(s)).toBe(true);
    // swap to a bilateral exercise: steps are rebuilt without sides
    s = playerReducer(s, { type: 'swap', exercise: getExercise('face-pull-er')! });
    expect(s.items[1]).toMatchObject({
      exerciseId: 'face-pull-er',
      originalExerciseId: 'cable-er-0',
      sets: 3,
      unilateral: false,
      dose: { kind: 'reps', reps: 15 },
    });
    expect(s.steps.slice(s.index)).toEqual([
      { kind: 'work', item: 1, set: 1, side: undefined },
      { kind: 'rest', item: 1, seconds: 60 },
      { kind: 'work', item: 1, set: 2, side: undefined },
      { kind: 'rest', item: 1, seconds: 60 },
      { kind: 'work', item: 1, set: 3, side: undefined },
    ]);
  });

  it('does not swap once a set of the exercise is done', () => {
    let s = start(session([{ exerciseId: 'cable-er-0' }]));
    s = complete(s);
    expect(canSwap(s)).toBe(false);
    expect(playerReducer(s, { type: 'swap', exercise: getExercise('side-lying-db-er')! })).toBe(s);
  });

  it('records an optional tightness rating, also after the session ends', () => {
    let s = start(session([{ exerciseId: 'dead-hang', sets: 1 }]));
    s = completeAll(s);
    s = playerReducer(s, { type: 'rate', item: 0, value: 4 });
    expect(s.items[0]!.tightness).toBe(4);
    s = playerReducer(s, { type: 'rate', item: 0, value: undefined });
    expect(s.items[0]!.tightness).toBeUndefined();
  });

  it('ignores progress actions after the session has ended', () => {
    const s = completeAll(start(session([{ exerciseId: 'dead-hang', sets: 1 }])));
    expect(complete(s)).toBe(s);
  });
});

describe('toSessionLog', () => {
  it('produces the brief §7 log shape', () => {
    let s = start(session([{ exerciseId: 'dead-hang', sets: 1 }]));
    s = playerReducer(s, { type: 'rate', item: 0, value: 2 });
    s = completeAll(s, T0 + 60_000);
    expect(toSessionLog(s, 'log-1')).toEqual({
      id: 'log-1',
      sessionId: 'test',
      programId: 'p',
      startedAt: '2026-11-26T18:00:00.000Z',
      endedAt: '2026-11-26T18:01:00.000Z',
      items: [{ exerciseId: 'dead-hang', setsDone: 1, skipped: false, tightness: 2 }],
    });
  });
});

describe('swapOptions', () => {
  const twoItems = () =>
    start(session([{ exerciseId: 'cable-er-0' }, { exerciseId: 'cable-ir-0' }]));

  it('offers alternatives the user has equipment for', () => {
    const s = twoItems();
    expect(swapOptions(s, getExercise, ['cable', 'dumbbell', 'mat']).map((e) => e.id)).toEqual([
      'side-lying-db-er',
    ]);
  });

  it('hides alternatives that need missing equipment', () => {
    // side-lying-db-er needs dumbbell + mat
    expect(swapOptions(twoItems(), getExercise, ['cable', 'mat'])).toEqual([]);
    expect(swapOptions(twoItems(), getExercise, ['cable', 'dumbbell'])).toEqual([]);
  });

  it('offers the original back after a swap', () => {
    let s = twoItems();
    s = playerReducer(s, { type: 'swap', exercise: getExercise('side-lying-db-er')! });
    expect(swapOptions(s, getExercise, ['cable', 'dumbbell', 'mat']).map((e) => e.id)).toEqual([
      'cable-er-0',
    ]);
  });

  it('returns nothing for exercises without alternatives', () => {
    let s = twoItems();
    s = playerReducer(s, { type: 'skipExercise', at: T0 }); // now on cable-ir-0
    expect(swapOptions(s, getExercise, ['cable', 'dumbbell', 'mat'])).toEqual([]);
  });
});
