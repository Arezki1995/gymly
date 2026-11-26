import { Link } from 'react-router-dom';
import { programs } from '../../content';
import { GOAL_LABELS } from '../../content/labels';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Chip } from '../../components/Chip';

export function ProgramsScreen() {
  return (
    <>
      <ScreenHeader title="Programs" subtitle="Structured mobility plans" />
      <ul className="grid gap-3">
        {programs.map((p) => {
          const minutes = Math.max(...p.sessions.map((s) => s.estMinutes));
          return (
            <li key={p.id}>
              <Link
                to={`/programs/${p.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:active:bg-slate-800"
              >
                <h2 className="font-semibold">{p.name}</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{p.description}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {p.weeks} weeks · {p.sessionsPerWeek}×/week · ~{minutes} min · {p.sessions.length}{' '}
                  rotating sessions
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.goals.map((g) => (
                    <Chip key={g} tone="brand">
                      {GOAL_LABELS[g]}
                    </Chip>
                  ))}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
