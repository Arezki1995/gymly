import { Link, useParams } from 'react-router-dom';
import { getExercise, programs } from '../../content';
import { GOAL_LABELS } from '../../content/labels';
import { BackLink } from '../../components/BackLink';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { formatPrescription } from '../../lib/format';

const PROGRESSION_TEXT = {
  'add-set': 'add one set',
  'add-seconds': 'add 10 seconds to each hold',
  'add-reps': 'add a few reps',
  'level-up': 'move to the harder variant',
} as const;

export function ProgramDetailScreen() {
  const { programId } = useParams();
  const program = programs.find((p) => p.id === programId);

  if (!program) {
    return (
      <>
        <BackLink label="Programs" fallback="/programs" />
        <EmptyState message="This program doesn't exist." />
      </>
    );
  }

  return (
    <article>
      <BackLink label="Programs" fallback="/programs" />
      <h1 className="text-2xl font-bold tracking-tight">{program.name}</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">{program.description}</p>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        {program.weeks} weeks · {program.sessionsPerWeek}× per week. Every{' '}
        {program.progression.everyWeeks} weeks, {PROGRESSION_TEXT[program.progression.rule]}.
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {program.goals.map((g) => (
          <Chip key={g} tone="brand">
            {GOAL_LABELS[g]}
          </Chip>
        ))}
      </div>

      <ol className="mt-6 grid gap-4">
        {program.sessions.map((session) => (
          <li
            key={session.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">{session.name}</h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                ~{session.estMinutes} min
              </span>
            </div>
            {session.blocks.map((block) => (
              <div key={block.title} className="mt-3">
                <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                  {block.title}
                </h3>
                <ul className="mt-1 grid gap-1">
                  {block.items.map((item, i) => {
                    const ex = getExercise(item.exerciseId)!;
                    return (
                      <li key={`${item.exerciseId}-${i}`} className="flex justify-between gap-3">
                        <Link
                          to={`/library/${ex.id}`}
                          className="py-1 underline-offset-2 hover:underline"
                        >
                          {ex.name}
                        </Link>
                        <span className="shrink-0 py-1 text-right text-sm text-slate-500 dark:text-slate-400">
                          {formatPrescription(
                            item.sets ?? ex.defaultSets,
                            item.dose ?? ex.dose,
                            ex.unilateral,
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <Link
              to={`/play/${program.id}/${session.id}`}
              className="mt-4 flex min-h-14 items-center justify-center rounded-2xl bg-brand-600 text-lg font-semibold text-white active:bg-brand-700"
            >
              Start {session.name}
            </Link>
          </li>
        ))}
      </ol>
    </article>
  );
}
