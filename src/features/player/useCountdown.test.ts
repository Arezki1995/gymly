import { act, renderHook } from '@testing-library/react';
import { useCountdown } from './useCountdown';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-26T18:00:00Z'));
});
afterEach(() => vi.useRealTimers());

const shown = (r: { current: { remaining: number } }) => Math.ceil(r.current.remaining);

describe('useCountdown', () => {
  it('counts down and calls onDone exactly once', () => {
    const onDone = vi.fn();
    const { result } = renderHook(() => useCountdown(onDone));
    expect(result.current.status).toBe('idle');

    act(() => result.current.start(3));
    expect(result.current).toMatchObject({ status: 'running', total: 3 });
    expect(shown(result)).toBe(3);

    act(() => vi.advanceTimersByTime(1000));
    expect(shown(result)).toBe(2);

    act(() => vi.advanceTimersByTime(2500));
    expect(result.current.status).toBe('done');
    expect(result.current.remaining).toBe(0);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('pauses and resumes without losing time', () => {
    const { result } = renderHook(() => useCountdown());
    act(() => result.current.start(10));
    act(() => vi.advanceTimersByTime(4000));
    act(() => result.current.pause());
    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current.status).toBe('paused');
    expect(shown(result)).toBe(6);
    act(() => result.current.resume());
    act(() => vi.advanceTimersByTime(1000));
    expect(shown(result)).toBe(5);
  });

  it('adds time while running (e.g. +15 s rest)', () => {
    const onDone = vi.fn();
    const { result } = renderHook(() => useCountdown(onDone));
    act(() => result.current.start(5));
    act(() => vi.advanceTimersByTime(4000));
    act(() => result.current.add(15));
    expect(result.current.total).toBe(20);
    act(() => vi.advanceTimersByTime(10_000));
    expect(onDone).not.toHaveBeenCalled();
    expect(shown(result)).toBe(6);
  });

  it('stays correct when timer ticks are throttled (background tab)', () => {
    const onDone = vi.fn();
    const { result } = renderHook(() => useCountdown(onDone));
    act(() => result.current.start(30));
    // the clock jumps 40 s while no interval callbacks ran, then one tick arrives
    act(() => {
      vi.setSystemTime(Date.now() + 40_000);
      vi.advanceTimersByTime(200);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('done');
  });

  it('uses the latest onDone callback', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(({ cb }) => useCountdown(cb), {
      initialProps: { cb: first },
    });
    act(() => result.current.start(1));
    rerender({ cb: second });
    act(() => vi.advanceTimersByTime(1200));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
