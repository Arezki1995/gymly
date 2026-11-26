import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

/** Lightweight CSS confetti. Renders nothing when the user prefers reduced motion. */
export function Confetti({ pieces = 40 }: { pieces?: number }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {Array.from({ length: pieces }, (_, i) => {
        // deterministic spread so renders are pure
        const left = (i * 37) % 100;
        const delay = ((i * 53) % 100) / 100;
        const duration = 2.2 + ((i * 29) % 10) / 10;
        return (
          <span
            key={i}
            className="confetti-piece absolute top-0 block h-3 w-2 rounded-sm"
            style={{
              left: `${left}%`,
              backgroundColor: COLORS[i % COLORS.length],
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
    </div>
  );
}
