import type { SessionSummary } from './model';
import { formatSeconds } from '../../lib/format';
import { Confetti } from './Confetti';
import { Footer, PlayerButton } from './ui';

type Props = { sessionName: string; summary: SessionSummary; onClose: () => void };

export function EndScreen({ sessionName, summary, onClose }: Props) {
  const stats = [
    { label: 'Time', value: formatSeconds(summary.durationSeconds) },
    { label: 'Sets done', value: `${summary.setsDone} / ${summary.totalSets}` },
    { label: 'Exercises done', value: String(summary.exercisesDone) },
    { label: 'Skipped', value: String(summary.exercisesSkipped) },
  ];
  return (
    <>
      <Confetti />
      <div className="mt-10 text-center">
        <div className="text-6xl" aria-hidden>
          {summary.allDone ? '🏆' : '💪'}
        </div>
        <h1 className="mt-4 text-3xl font-bold">Session complete</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          {sessionName}
          {summary.allDone ? ': every exercise done, nothing skipped.' : '. Nice work.'}
        </p>
      </div>
      <dl className="mt-8 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 text-center dark:bg-slate-900">
            <dt className="text-xs text-slate-500 dark:text-slate-400">{s.label}</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
      <Footer>
        <PlayerButton onClick={onClose}>Done</PlayerButton>
      </Footer>
    </>
  );
}
