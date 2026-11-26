import type { Area, EquipmentId, Exercise, Goal, Level } from '../../content/schema';

export type LibraryFilters = {
  query: string;
  area?: Area;
  goal?: Goal;
  level?: Level;
  /** When set, only exercises whose equipment is all in this list (bodyweight always counts). */
  equipment?: EquipmentId[];
};

export function hasEquipmentFor(exercise: Exercise, available: readonly EquipmentId[]): boolean {
  return exercise.equipment.every((e) => e === 'none' || available.includes(e));
}

function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Every word of the query must appear in the name, cues or goal/area ids. */
function matchesQuery(exercise: Exercise, query: string): boolean {
  const words = normalise(query).split(' ').filter(Boolean);
  if (!words.length) return true;
  const haystack = normalise(
    [exercise.name, exercise.area, exercise.type, ...exercise.goals, ...exercise.cues].join(' '),
  );
  return words.every((w) => haystack.includes(w));
}

export function filterExercises(list: readonly Exercise[], f: LibraryFilters): Exercise[] {
  return list.filter(
    (e) =>
      (!f.area || e.area === f.area) &&
      (!f.goal || e.goals.includes(f.goal)) &&
      (!f.level || e.level === f.level) &&
      (!f.equipment || hasEquipmentFor(e, f.equipment)) &&
      matchesQuery(e, f.query),
  );
}
