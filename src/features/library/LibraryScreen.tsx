import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { exercises } from '../../content';
import {
  AREAS,
  EQUIPMENT_IDS,
  GOALS,
  LEVELS,
  type Area,
  type EquipmentId,
  type Goal,
  type Level,
} from '../../content/schema';
import {
  AREA_LABELS,
  EQUIPMENT_LABELS,
  GOAL_LABELS,
  LEVEL_LABELS,
  TYPE_LABELS,
} from '../../content/labels';
import { ScreenHeader } from '../../components/ScreenHeader';
import { EmptyState } from '../../components/EmptyState';
import { Chip } from '../../components/Chip';
import { formatPrescription } from '../../lib/format';
import { filterExercises, type LibraryFilters } from './filter';

/** Picked equipment ("bodyweight" is implied, so it isn't offered as a toggle). */
const EQUIPMENT_CHOICES = EQUIPMENT_IDS.filter((e) => e !== 'none');

function oneOf<T extends string | number>(options: readonly T[], value: string | null) {
  return options.find((o) => String(o) === value);
}

/** Filters live in the URL so they survive opening an exercise and going back. */
function useLibraryFilters() {
  const [params, setParams] = useSearchParams();
  const eq = params.get('eq');
  const filters: LibraryFilters = {
    query: params.get('q') ?? '',
    area: oneOf<Area>(AREAS, params.get('area')),
    goal: oneOf<Goal>(GOALS, params.get('goal')),
    level: oneOf<Level>(LEVELS, params.get('level')),
    equipment:
      eq === null
        ? undefined
        : eq
            .split(',')
            .map((e) => oneOf<EquipmentId>(EQUIPMENT_IDS, e))
            .filter((e): e is EquipmentId => !!e),
  };
  const set = (key: string, value: string | undefined) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === undefined || (value === '' && key !== 'eq')) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  return { filters, set, clear: () => setParams({}, { replace: true }) };
}

const selectClass =
  'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900';

export function LibraryScreen() {
  const { filters, set, clear } = useLibraryFilters();
  const results = useMemo(() => filterExercises(exercises, filters), [filters]);
  const activeCount =
    [filters.area, filters.goal, filters.level].filter(Boolean).length +
    (filters.equipment ? 1 : 0);

  const toggleEquipment = (id: EquipmentId) => {
    const current = filters.equipment ?? [];
    const next = current.includes(id) ? current.filter((e) => e !== id) : [...current, id];
    set('eq', next.join(','));
  };

  return (
    <>
      <ScreenHeader
        title="Library"
        subtitle={`${exercises.length} exercises for Basic-Fit clubs`}
      />

      <label className="block">
        <span className="sr-only">Search exercises</span>
        <input
          type="search"
          value={filters.query}
          onChange={(e) => set('q', e.target.value)}
          placeholder="Search exercises"
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      <details
        className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800"
        open={activeCount > 0}
      >
        <summary className="flex min-h-11 cursor-pointer items-center justify-between px-4 text-sm font-medium">
          <span>Filters{activeCount > 0 && ` (${activeCount})`}</span>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                clear();
              }}
              className="min-h-11 px-2 text-brand-600 dark:text-brand-400"
            >
              Clear all
            </button>
          )}
        </summary>
        <div className="grid gap-3 px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Area
              <select
                className={selectClass}
                value={filters.area ?? ''}
                onChange={(e) => set('area', e.target.value)}
              >
                <option value="">All areas</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {AREA_LABELS[a]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Level
              <select
                className={selectClass}
                value={filters.level ?? ''}
                onChange={(e) => set('level', e.target.value)}
              >
                <option value="">All levels</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {LEVEL_LABELS[l]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Goal
            <select
              className={selectClass}
              value={filters.goal ?? ''}
              onChange={(e) => set('goal', e.target.value)}
            >
              <option value="">All goals</option>
              {GOALS.map((g) => (
                <option key={g} value={g}>
                  {GOAL_LABELS[g]}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Equipment I have
            </legend>
            <label className="mt-1 flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="size-5 accent-brand-600"
                checked={filters.equipment !== undefined}
                onChange={(e) => set('eq', e.target.checked ? '' : undefined)}
              />
              Only show what I can do with my kit
            </label>
            {filters.equipment && (
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_CHOICES.map((id) => {
                  const on = filters.equipment!.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleEquipment(id)}
                      className={`min-h-11 rounded-full border px-3 text-sm ${
                        on
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {EQUIPMENT_LABELS[id]}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>
        </div>
      </details>

      <p className="mt-4 mb-2 text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
        {results.length} {results.length === 1 ? 'exercise' : 'exercises'}
      </p>

      {results.length === 0 ? (
        <EmptyState message="No exercises match. Try clearing a filter." />
      ) : (
        <ul className="grid gap-2">
          {results.map((e) => (
            <li key={e.id}>
              <Link
                to={`/library/${e.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:active:bg-slate-800"
              >
                <div className="font-semibold">{e.name}</div>
                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {formatPrescription(e.defaultSets, e.dose, e.unilateral)}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Chip tone="brand">{AREA_LABELS[e.area]}</Chip>
                  <Chip>{TYPE_LABELS[e.type]}</Chip>
                  <Chip>{LEVEL_LABELS[e.level]}</Chip>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
