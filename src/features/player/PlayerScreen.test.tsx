import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../../AppRoutes';

const request = vi.fn();
const release = vi.fn(() => Promise.resolve());
const vibrate = vi.fn();

beforeEach(() => {
  // Fake only what the countdown uses; user-event needs the real setTimeout.
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
  vi.setSystemTime(new Date('2026-11-26T18:00:00Z'));
  request.mockReset().mockResolvedValue({ release });
  vibrate.mockReset();
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
  Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
});
afterEach(() => {
  vi.useRealTimers();
  // @ts-expect-error test cleanup
  delete navigator.wakeLock;
  // @ts-expect-error test cleanup
  delete navigator.vibrate;
});

function renderPlayer(path = '/play/rotator-reset/rotator-reset-a') {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/programs/rotator-reset', path]} initialIndex={1}>
      <AppRoutes />
    </MemoryRouter>,
  );
  return user;
}

const heading = () => screen.getByRole('heading', { level: 1 }).textContent;
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('session player', () => {
  it('runs a full Rotator Reset A session, letting timers auto-advance', async () => {
    const user = renderPlayer();
    await act(async () => undefined); // let the wake lock request resolve
    expect(request).toHaveBeenCalledWith('screen');

    const seen: string[] = [];
    for (let guard = 0; guard < 3000; guard++) {
      const h = heading()!;
      if (h === 'Session complete') break;
      if (!seen.includes(h) && h !== 'Rest') seen.push(h);

      if (screen.queryByRole('button', { name: 'Start hold' })) {
        await user.click(screen.getByRole('button', { name: 'Start hold' }));
      } else if (screen.queryByRole('timer')) {
        advance(1000); // rests and holds finish on their own
      } else {
        await user.click(screen.getByRole('button', { name: 'Done' }));
      }
    }

    expect(seen).toEqual([
      'Shoulder CARs',
      'Cable external rotation (arm at side)',
      'Cable internal rotation (arm at side)',
      'Side-lying dumbbell external rotation',
      'Sleeper stretch',
      'Cable face pull with external rotation',
    ]);
    expect(heading()).toBe('Session complete');
    expect(screen.getByText('25 / 25')).toBeInTheDocument();
    expect(vibrate).toHaveBeenCalled(); // end-of-timer buzz
    expect(release).toHaveBeenCalled(); // wake lock let go at the end
  });

  it('shows set and side, then rests between sets with skip and +15 s', async () => {
    const user = renderPlayer();
    await user.click(screen.getByRole('button', { name: 'Done' })); // CARs L
    await user.click(screen.getByRole('button', { name: 'Done' })); // CARs R
    expect(heading()).toBe('Cable external rotation (arm at side)');
    expect(screen.getByText('Set 1 / 3')).toBeInTheDocument();
    expect(screen.getByText('Left side')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByText('Right side')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(heading()).toBe('Rest');
    expect(screen.getByRole('timer')).toHaveAccessibleName('45 seconds left');
    await user.click(screen.getByRole('button', { name: '+15 s' }));
    advance(50_000);
    expect(heading()).toBe('Rest');
    expect(screen.getByRole('timer')).toHaveAccessibleName('10 seconds left');
    await user.click(screen.getByRole('button', { name: 'Skip rest' }));
    expect(screen.getByText('Set 2 / 3')).toBeInTheDocument();
  });

  it('holds: get-ready countdown, auto-advance, and auto-start for the other side', async () => {
    const user = renderPlayer('/play/overhead-unlock/overhead-unlock-a');
    // skip to Bench lat stretch (3rd exercise, a 40 s bilateral hold, 2 sets)
    await user.click(screen.getByRole('button', { name: 'Skip exercise' }));
    await user.click(screen.getByRole('button', { name: 'Skip exercise' }));
    expect(heading()).toBe('Bench lat & triceps stretch');

    await user.click(screen.getByRole('button', { name: 'Start hold' }));
    expect(screen.getByText('Get ready')).toBeInTheDocument();
    advance(5000);
    expect(screen.getByText('Hold')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    advance(60_000);
    expect(screen.getByText('Paused')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Resume' }));
    advance(41_000);
    expect(heading()).toBe('Rest');
    advance(16_000);
    // set 2 starts its get-ready countdown without a tap
    expect(screen.getByText('Set 2 / 2')).toBeInTheDocument();
    expect(screen.getByText('Get ready')).toBeInTheDocument();
  });

  it('swaps only to alternatives I have equipment for', async () => {
    const user = renderPlayer();
    await user.click(screen.getByRole('button', { name: 'Done' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));
    await user.click(screen.getByRole('button', { name: 'Swap' }));
    const dialog = screen.getByRole('dialog', { name: 'Swap exercise' });
    expect(dialog).toHaveTextContent('Side-lying dumbbell external rotation');
    await user.click(screen.getByRole('button', { name: /side-lying dumbbell/i }));
    expect(heading()).toBe('Side-lying dumbbell external rotation');

    // after a set is done, swapping is disabled
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByRole('button', { name: 'Swap' })).toBeDisabled();
  });

  it('records the optional tightness rating', async () => {
    const user = renderPlayer();
    await user.click(screen.getByRole('button', { name: 'Tightness 4 of 5' }));
    expect(screen.getByRole('button', { name: 'Tightness 4 of 5' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('shows a not-found message for unknown sessions', () => {
    renderPlayer('/play/rotator-reset/nope');
    expect(screen.getByText(/doesn't exist/)).toBeInTheDocument();
  });
});
