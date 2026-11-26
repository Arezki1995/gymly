type Props = {
  remaining: number;
  total: number;
  /** Text under the number, e.g. "seconds" or "Get ready". */
  caption?: string;
  tone?: 'brand' | 'amber' | 'slate';
};

const strokes = {
  brand: 'stroke-brand-500',
  amber: 'stroke-amber-500',
  slate: 'stroke-slate-400',
};

const R = 88;
const C = 2 * Math.PI * R;

/** Large circular countdown. The ring empties as time runs out. */
export function CountdownRing({ remaining, total, caption, tone = 'brand' }: Props) {
  const fraction = total > 0 ? Math.min(1, remaining / total) : 0;
  const seconds = Math.ceil(remaining);
  const label =
    seconds >= 60
      ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
      : seconds;
  return (
    <div className="relative mx-auto aspect-square w-[min(11rem,22dvh)]">
      <svg viewBox="0 0 200 200" className="size-full -rotate-90" aria-hidden>
        <circle
          cx="100"
          cy="100"
          r={R}
          className="fill-none stroke-slate-200 dark:stroke-slate-800"
          strokeWidth="12"
        />
        <circle
          cx="100"
          cy="100"
          r={R}
          className={`fill-none ${strokes[tone]} transition-[stroke-dashoffset] duration-200 ease-linear`}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - fraction)}
        />
      </svg>
      <div
        role="timer"
        aria-label={`${seconds} seconds left`}
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <span className="text-6xl font-bold tabular-nums">{label}</span>
        {caption && (
          <span className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {caption}
          </span>
        )}
      </div>
    </div>
  );
}
