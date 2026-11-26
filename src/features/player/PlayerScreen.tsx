import { useCallback, useReducer, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getExercise, programs } from '../../content';
import type { Exercise, Program, Session } from '../../content/schema';
import { DEFAULT_EQUIPMENT } from '../../lib/equipment';
import { signalEnd, signalGo, unlockAudio } from '../../lib/feedback';
import { useWakeLock } from '../../lib/useWakeLock';
import { EmptyState } from '../../components/EmptyState';
import { BackLink } from '../../components/BackLink';
import {
  canSwap,
  createPlayerState,
  currentStep,
  playerReducer,
  summarise,
  swapOptions,
} from './model';
import { HoldTimer } from './HoldTimer';
import { RestView } from './RestView';
import { SwapSheet } from './SwapSheet';
import { EndScreen } from './EndScreen';
import { TightnessRating } from './TightnessRating';
import { Footer, PlayerButton, SideBadge } from './ui';

export function PlayerScreen() {
  const { programId, sessionId } = useParams();
  const program = programs.find((p) => p.id === programId);
  const session = program?.sessions.find((s) => s.id === sessionId);
  if (!program || !session) {
    return (
      <div className="mx-auto max-w-[480px] p-4">
        <BackLink label="Programs" fallback="/programs" />
        <EmptyState message="This session doesn't exist." />
      </div>
    );
  }
  return <Player key={session.id} program={program} session={session} />;
}

function Player({ program, session }: { program: Program; session: Session }) {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(playerReducer, undefined, () =>
    createPlayerState(session, getExercise, Date.now(), program.id),
  );
  const [swapOpen, setSwapOpen] = useState(false);
  // Sound/vibration toggle; moves to Settings in Phase 3.
  const [feedbackOn, setFeedbackOn] = useState(true);
  const feedback = { sound: feedbackOn, vibration: feedbackOn };

  const finished = state.endedAt !== undefined;
  const wakeLockSupported = useWakeLock(!finished);

  const complete = useCallback(() => dispatch({ type: 'complete', at: Date.now() }), []);
  const exit = () => navigate(`/programs/${program.id}`, { replace: true });
  const close = () => {
    if (state.index === 0 || finished || window.confirm('Leave this session? It won’t be saved.'))
      exit();
  };

  const step = currentStep(state);
  const item = step ? state.items[step.item]! : undefined;
  const exercise = item ? getExercise(item.exerciseId)! : undefined;
  const progress = state.steps.length ? state.index / state.steps.length : 1;

  let body: React.ReactNode;
  if (finished || !step || !item || !exercise) {
    body = (
      <EndScreen
        sessionName={`${program.name} · ${session.name}`}
        summary={summarise(state)}
        onClose={exit}
      />
    );
  } else if (step.kind === 'rest') {
    const next = state.steps[state.index + 1];
    const nextItem = next ? state.items[next.item]! : item;
    body = (
      <RestView
        key={state.index}
        seconds={step.seconds}
        upNext={{
          name: getExercise(nextItem.exerciseId)!.name,
          set: next?.kind === 'work' ? next.set : 1,
          sets: nextItem.sets,
          side: next?.kind === 'work' ? next.side : undefined,
        }}
        onFinished={() => {
          signalEnd(feedback);
          complete();
        }}
        onSkip={complete}
      />
    );
  } else {
    const swappable = canSwap(state);
    const secondary = (
      <div className="grid grid-cols-2 gap-3">
        <PlayerButton
          variant="secondary"
          onClick={() => setSwapOpen(true)}
          disabled={!swappable}
          className="disabled:opacity-40"
        >
          Swap
        </PlayerButton>
        <PlayerButton
          variant="secondary"
          onClick={() => dispatch({ type: 'skipExercise', at: Date.now() })}
        >
          Skip exercise
        </PlayerButton>
      </div>
    );
    const firstOfExercise = step.set === 1 && step.side !== 'R';
    body = (
      <>
        <p className="mt-1 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          {item.block}
        </p>
        <h1 className="mt-1 text-3xl leading-tight font-bold">{exercise.name}</h1>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-full bg-slate-200 px-3 py-1 text-base font-bold tabular-nums dark:bg-slate-800">
            Set {step.set} / {item.sets}
          </span>
          {step.side && <SideBadge side={step.side} />}
        </div>

        {item.dose.kind === 'reps' ? (
          <>
            <div className="mt-8 text-center">
              <div className="text-8xl font-bold tabular-nums">{item.dose.reps}</div>
              <div className="text-lg text-slate-500 dark:text-slate-400">reps</div>
            </div>
            <Cues exercise={exercise} />
            <TightnessRating
              value={item.tightness}
              onChange={(value) => dispatch({ type: 'rate', item: step.item, value })}
            />
            <Footer>
              {secondary}
              <PlayerButton onClick={complete}>Done</PlayerButton>
            </Footer>
          </>
        ) : (
          <HoldTimer
            key={state.index}
            seconds={item.dose.seconds}
            autoStart={!firstOfExercise}
            leadInLabel={step.side === 'R' && step.set === 1 ? 'Switch sides' : 'Get ready'}
            onGo={() => signalGo(feedback)}
            onFinished={() => {
              signalEnd(feedback);
              complete();
            }}
            secondary={
              <>
                <Cues exercise={exercise} />
                <TightnessRating
                  value={item.tightness}
                  onChange={(value) => dispatch({ type: 'rate', item: step.item, value })}
                />
                {secondary}
              </>
            }
          />
        )}
      </>
    );
  }

  return (
    <div
      className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      onPointerDown={unlockAudio}
    >
      {!finished && (
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={close}
            aria-label="Leave session"
            className="flex size-11 items-center justify-center rounded-xl text-2xl text-slate-500 active:bg-slate-200 dark:active:bg-slate-800"
          >
            ×
          </button>
          <div className="flex-1">
            <div className="text-center text-xs text-slate-500 dark:text-slate-400">
              Exercise {Math.min((step?.item ?? 0) + 1, state.items.length)} of {state.items.length}
              {!wakeLockSupported && ' · keep your screen on'}
            </div>
            <div
              className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
              role="progressbar"
              aria-label="Session progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
            >
              <div
                className="h-full bg-brand-500 transition-[width]"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackOn((v) => !v)}
            aria-pressed={feedbackOn}
            aria-label="Sound and vibration"
            className="flex size-11 items-center justify-center rounded-xl text-xl active:bg-slate-200 dark:active:bg-slate-800"
          >
            <span aria-hidden>{feedbackOn ? '🔔' : '🔕'}</span>
          </button>
        </header>
      )}

      <main className="flex flex-1 flex-col">{body}</main>

      {swapOpen && step && (
        <SwapSheet
          options={swapOptions(state, getExercise, DEFAULT_EQUIPMENT)}
          onClose={() => setSwapOpen(false)}
          onPick={(ex) => {
            dispatch({ type: 'swap', exercise: ex });
            setSwapOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Cues({ exercise }: { exercise: Exercise }) {
  return (
    <ul className="mt-4 grid gap-1 text-sm text-slate-600 dark:text-slate-300">
      {exercise.cues.map((c) => (
        <li key={c}>• {c}</li>
      ))}
      <li className="text-amber-700 dark:text-amber-300">⚠︎ {exercise.cautions[0]}</li>
    </ul>
  );
}
