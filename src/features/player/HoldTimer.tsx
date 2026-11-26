import { useEffect, useRef } from 'react';
import { CountdownRing } from '../../components/CountdownRing';
import { useCountdown } from './useCountdown';
import { Footer, PlayerButton } from './ui';

export const LEAD_IN_SECONDS = 5;

type Props = {
  seconds: number;
  /** Start the get-ready countdown straight away (later sets / the second side). */
  autoStart: boolean;
  leadInLabel: string;
  onGo: () => void;
  onFinished: () => void;
  secondary: React.ReactNode;
};

/**
 * A hold: tap Start (or auto-start), a short get-ready countdown, then the hold itself.
 * When the hold ends it calls `onFinished`, which advances the player automatically.
 */
export function HoldTimer({ seconds, autoStart, leadInLabel, onGo, onFinished, secondary }: Props) {
  const hold = useCountdown(onFinished);
  const leadIn = useCountdown(() => {
    onGo();
    hold.start(seconds);
  });
  const phase = hold.status !== 'idle' ? 'hold' : leadIn.status !== 'idle' ? 'lead-in' : 'waiting';

  const beginLeadIn = () => leadIn.start(LEAD_IN_SECONDS);
  const beginHold = () => {
    leadIn.pause(); // stop it from firing later
    onGo();
    hold.start(seconds);
  };

  // Auto-start once on mount; the component is keyed per step.
  const started = useRef(false);
  const { start: startLeadIn } = leadIn;
  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      startLeadIn(LEAD_IN_SECONDS);
    }
  }, [autoStart, startLeadIn]);

  const ring =
    phase === 'waiting' ? (
      <CountdownRing remaining={seconds} total={seconds} caption="seconds" tone="slate" />
    ) : phase === 'lead-in' ? (
      <CountdownRing
        remaining={leadIn.remaining}
        total={leadIn.total}
        caption={leadInLabel}
        tone="amber"
      />
    ) : (
      <CountdownRing
        remaining={hold.remaining}
        total={hold.total}
        caption={hold.status === 'paused' ? 'Paused' : 'Hold'}
      />
    );

  return (
    <>
      <div className="mt-4">{ring}</div>
      <Footer>
        {secondary}
        {phase === 'waiting' && <PlayerButton onClick={beginLeadIn}>Start hold</PlayerButton>}
        {phase === 'lead-in' && <PlayerButton onClick={beginHold}>Start now</PlayerButton>}
        {phase === 'hold' && (
          <div className="grid grid-cols-[1fr_auto] gap-3">
            {hold.status === 'paused' ? (
              <PlayerButton onClick={hold.resume}>Resume</PlayerButton>
            ) : (
              <PlayerButton onClick={hold.pause}>Pause</PlayerButton>
            )}
            <PlayerButton variant="secondary" className="min-h-16" onClick={onFinished}>
              Done
            </PlayerButton>
          </div>
        )}
      </Footer>
    </>
  );
}
