import type { ReactNode } from 'react';

type Tone = 'neutral' | 'brand' | 'amber';

const tones: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-700/30 dark:text-brand-100',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
};

export function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
