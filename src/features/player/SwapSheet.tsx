import { useEffect, useRef } from 'react';
import type { Exercise } from '../../content/schema';
import { EQUIPMENT_LABELS } from '../../content/labels';
import { formatPrescription } from '../../lib/format';

type Props = {
  options: Exercise[];
  onPick: (exercise: Exercise) => void;
  onClose: () => void;
};

/** Bottom sheet listing swaps the user has equipment for. */
export function SwapSheet({ options, onPick, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="swap-title"
        className="w-full max-w-[480px] rounded-t-3xl bg-slate-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:bg-slate-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="swap-title" className="text-lg font-semibold">
            Swap exercise
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 rounded-xl text-sm font-medium text-brand-600 dark:text-brand-400"
          >
            Cancel
          </button>
        </div>
        {options.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No alternatives for this one with the equipment you have. You can skip it instead.
          </p>
        ) : (
          <ul className="mt-2 grid gap-2">
            {options.map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => onPick(ex)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left active:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:active:bg-slate-800"
                >
                  <div className="font-semibold">{ex.name}</div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {formatPrescription(ex.defaultSets, ex.dose, ex.unilateral)} ·{' '}
                    {ex.equipment.map((e) => EQUIPMENT_LABELS[e]).join(' + ')}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
