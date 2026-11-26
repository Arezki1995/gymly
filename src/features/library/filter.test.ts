import { exercises } from '../../content';
import { filterExercises, hasEquipmentFor } from './filter';

const ids = (list: { id: string }[]) => list.map((e) => e.id);

describe('filterExercises', () => {
  it('returns everything with no filters', () => {
    expect(filterExercises(exercises, { query: '' })).toHaveLength(exercises.length);
  });

  it('filters by area, goal and level together', () => {
    const r = filterExercises(exercises, { query: '', area: 'hip', goal: 'hip-ir', level: 2 });
    expect(ids(r)).toEqual(['90-90-ir-liftoff']);
  });

  it('searches names case- and accent-insensitively, all words must match', () => {
    expect(ids(filterExercises(exercises, { query: 'SLEEPER' }))).toEqual(['sleeper-stretch']);
    expect(ids(filterExercises(exercises, { query: 'cable external' }))).toEqual([
      'cable-er-0',
      'cable-er-90',
      'face-pull-er',
    ]);
    expect(filterExercises(exercises, { query: 'zzz' })).toEqual([]);
  });

  it('only keeps exercises the selected equipment covers', () => {
    const r = filterExercises(exercises, { query: '', equipment: [] });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((e) => e.equipment.every((x) => x === 'none'))).toBe(true);
    expect(
      ids(filterExercises(exercises, { query: '', equipment: ['mat'], area: 'shoulder' })),
    ).toEqual(['shoulder-cars', 'sleeper-stretch', 'cross-body-stretch']);
  });
});

describe('hasEquipmentFor', () => {
  it('needs every listed piece of equipment', () => {
    const e = exercises.find((x) => x.id === 'side-lying-db-er')!;
    expect(hasEquipmentFor(e, ['dumbbell'])).toBe(false);
    expect(hasEquipmentFor(e, ['dumbbell', 'mat'])).toBe(true);
  });
});
