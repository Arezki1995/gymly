import { useEffect } from 'react';
import { CountdownRing } from '../../components/CountdownRing';
import { useCountdown } from './useCountdown';
import { Footer, PlayerButton, SideBadge } from './ui';

type Props = {
  seconds: number;
  upNext: { name: string; set: number; sets: number; side?: 'L' | 'R' };
  onFinished: () => void;
  onSkip: () => void;
};

/** Rest between sets: counts down, then moves on by itself. */
export function RestView({ seconds, upNext, onFinished, onSkip }: Props) {
  const timer = useCountdown(onFinished);
  const { start } = timer;
  useEffect(() => start(seconds), [start, seconds]);

  return (
    <>
      <h1 className="mt-4 text-center text-3xl font-bold">Rest</h1>
      <div className="mt-6">
        <CountdownRing
          remaining={timer.remaining}
          total={timer.total}
          caption="Breathe"
          tone="slate"
        />
      </div>
      <div className="mt-6 rounded-2xl bg-white p-4 text-center dark:bg-slate-900">
        <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          Up next
        </div>
        <div className="mt-1 font-semibold">{upNext.name}</div>
        <div className="mt-2 flex items-center justify-center gap-2 text-sm">
          <span>
            Set {upNext.set} / {upNext.sets}
          </span>
          {upNext.side && <SideBadge side={upNext.side} />}
        </div>
      </div>
      <Footer>
        <div className="grid grid-cols-[auto_1fr] gap-3">
          <PlayerButton variant="secondary" className="min-h-16 px-6" onClick={() => timer.add(15)}>
            +15 s
          </PlayerButton>
          <PlayerButton onClick={onSkip}>Skip rest</PlayerButton>
        </div>
      </Footer>
    </>
  );
}
