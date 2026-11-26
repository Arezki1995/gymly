import type { Dose } from '../content/schema';

export function formatDose(dose: Dose): string {
  return dose.kind === 'reps' ? `${dose.reps} reps` : `${dose.seconds} s hold`;
}

/** e.g. "3 × 12 reps per side" or "2 × 30 s hold". */
export function formatPrescription(sets: number, dose: Dose, unilateral: boolean): string {
  return `${sets} × ${formatDose(dose)}${unilateral ? ' per side' : ''}`;
}

export function formatSeconds(total: number): string {
  if (total < 60) return `${total} s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return s ? `${m} min ${s} s` : `${m} min`;
}
