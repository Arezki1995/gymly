import { Link, useNavigate, useParams } from 'react-router-dom';
import { getExercise } from '../../content';
import {
  AREA_LABELS,
  EQUIPMENT_LABELS,
  GOAL_LABELS,
  LEVEL_LABELS,
  TYPE_LABELS,
} from '../../content/labels';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { formatPrescription, formatSeconds } from '../../lib/format';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ExerciseDetailScreen() {
  const { exerciseId = '' } = useParams();
  const navigate = useNavigate();
  const exercise = getExercise(exerciseId);

  const back = (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/library'))}
      className="-ml-2 mb-2 flex min-h-11 items-center gap-1 px-2 text-sm font-medium text-brand-600 dark:text-brand-400"
    >
      <span aria-hidden>‹</span> Library
    </button>
  );

  if (!exercise) {
    return (
      <>
        {back}
        <EmptyState message="This exercise doesn't exist." />
      </>
    );
  }

  const isStretch = exercise.type === 'stretch' || exercise.type === 'soft-tissue';
  const alternatives = (exercise.alternatives ?? [])
    .map(getExercise)
    .filter((e) => e !== undefined);

  return (
    <article>
      {back}
      <h1 className="text-2xl font-bold tracking-tight">{exercise.name}</h1>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip tone="brand">{AREA_LABELS[exercise.area]}</Chip>
        <Chip>{TYPE_LABELS[exercise.type]}</Chip>
        <Chip>{LEVEL_LABELS[exercise.level]}</Chip>
        {exercise.unilateral && <Chip>Left & right</Chip>}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Dose</dt>
          <dd className="mt-1 font-semibold">
            {formatPrescription(exercise.defaultSets, exercise.dose, exercise.unilateral)}
          </dd>
        </div>
        <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Rest</dt>
          <dd className="mt-1 font-semibold">{formatSeconds(exercise.restSeconds)}</dd>
        </div>
      </dl>

      <Section title="How to do it">
        <ol className="grid gap-2">
          {exercise.cues.map((cue, i) => (
            <li key={cue} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-700/30 dark:text-brand-100">
                {i + 1}
              </span>
              <span>{cue}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Cautions">
        <ul className="grid gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
          {exercise.cautions.map((c) => (
            <li key={c}>⚠︎ {c}</li>
          ))}
          {isStretch && (
            <li>Mild discomfort is fine (3/10 or less). Pain is not: ease off or stop.</li>
          )}
          <li>Stop straight away if you feel sharp pain.</li>
        </ul>
      </Section>

      <Section title="Equipment">
        <div className="flex flex-wrap gap-1.5">
          {exercise.equipment.map((e) => (
            <Chip key={e}>{EQUIPMENT_LABELS[e]}</Chip>
          ))}
        </div>
      </Section>

      <Section title="Works on">
        <div className="flex flex-wrap gap-1.5">
          {exercise.goals.map((g) => (
            <Chip key={g} tone="brand">
              {GOAL_LABELS[g]}
            </Chip>
          ))}
        </div>
      </Section>

      {alternatives.length > 0 && (
        <Section title="Alternatives">
          <ul className="grid gap-2">
            {alternatives.map((alt) => (
              <li key={alt.id}>
                <Link
                  to={`/library/${alt.id}`}
                  className="flex min-h-12 items-center justify-between rounded-2xl border border-slate-200 px-4 dark:border-slate-800"
                >
                  <span>{alt.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {alt.equipment.map((e) => EQUIPMENT_LABELS[e]).join(' + ')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {exercise.videoUrl && (
        <Section title="Video">
          <a
            href={exercise.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-brand-600 underline dark:text-brand-400"
          >
            Watch a demo
          </a>
        </Section>
      )}
    </article>
  );
}
