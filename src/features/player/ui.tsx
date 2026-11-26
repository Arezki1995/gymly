import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const variants: Record<Variant, string> = {
  primary:
    'min-h-16 bg-brand-600 text-xl font-semibold text-white active:bg-brand-700 disabled:opacity-50',
  secondary:
    'min-h-14 border border-slate-300 bg-white font-semibold active:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:active:bg-slate-800',
  ghost:
    'min-h-12 text-sm font-medium text-slate-600 active:bg-slate-100 dark:text-slate-300 dark:active:bg-slate-800',
};

export function PlayerButton({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`flex w-full items-center justify-center rounded-2xl px-4 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

/** Pushes its children to the bottom of the screen (thumb reach). */
export function Footer({ children }: { children: ReactNode }) {
  return <div className="mt-auto grid gap-3 pt-4">{children}</div>;
}

export function SideBadge({ side }: { side: 'L' | 'R' }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-base font-bold ${
        side === 'L'
          ? 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200'
          : 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200'
      }`}
    >
      {side === 'L' ? 'Left side' : 'Right side'}
    </span>
  );
}
