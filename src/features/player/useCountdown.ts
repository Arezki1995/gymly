import { useCallback, useEffect, useRef, useState } from 'react';

export type CountdownStatus = 'idle' | 'running' | 'paused' | 'done';

export type Countdown = {
  status: CountdownStatus;
  /** Seconds left (fractional). Show `Math.ceil(remaining)`. */
  remaining: number;
  /** Length of the current countdown in seconds, including any time added. */
  total: number;
  start: (seconds: number) => void;
  pause: () => void;
  resume: () => void;
  add: (seconds: number) => void;
};

type State = {
  status: CountdownStatus;
  total: number;
  /** Epoch ms the countdown ends at, while running. */
  endsAt: number;
  /** Seconds left, while paused/idle/done. */
  left: number;
};

/**
 * A countdown driven by wall-clock timestamps rather than counting ticks, so it stays
 * correct when the browser throttles timers (screen locked, app in the background).
 * `onDone` fires once when it reaches zero.
 */
export function useCountdown(onDone?: () => void, tickMs = 200): Countdown {
  const [state, setState] = useState<State>({ status: 'idle', total: 0, endsAt: 0, left: 0 });
  const [now, setNow] = useState(0);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (state.status !== 'running') return;
    const tick = () => {
      const t = Date.now();
      if (t >= state.endsAt) {
        clearInterval(id); // never fire twice, even if more ticks queue before re-render
        setState((s) => ({ ...s, status: 'done', left: 0 }));
        onDoneRef.current?.();
      } else {
        setNow(t);
      }
    };
    const id = setInterval(tick, tickMs);
    return () => clearInterval(id);
  }, [state.status, state.endsAt, tickMs]);

  const start = useCallback((seconds: number) => {
    const t = Date.now();
    setNow(t);
    setState({ status: 'running', total: seconds, endsAt: t + seconds * 1000, left: seconds });
  }, []);

  const pause = useCallback(() => {
    const t = Date.now();
    setState((s) =>
      s.status === 'running'
        ? { ...s, status: 'paused', left: Math.max(0, (s.endsAt - t) / 1000) }
        : s,
    );
  }, []);

  const resume = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setState((s) =>
      s.status === 'paused' ? { ...s, status: 'running', endsAt: t + s.left * 1000 } : s,
    );
  }, []);

  const add = useCallback((seconds: number) => {
    setState((s) => {
      if (s.status === 'running')
        return { ...s, total: s.total + seconds, endsAt: s.endsAt + seconds * 1000 };
      if (s.status === 'paused') return { ...s, total: s.total + seconds, left: s.left + seconds };
      return s;
    });
  }, []);

  const remaining =
    state.status === 'running' ? Math.max(0, (state.endsAt - now) / 1000) : state.left;

  return { status: state.status, remaining, total: state.total, start, pause, resume, add };
}
