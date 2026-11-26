import { formatDose, formatPrescription, formatSeconds } from './format';

describe('format', () => {
  it('formats doses and prescriptions', () => {
    expect(formatDose({ kind: 'reps', reps: 12 })).toBe('12 reps');
    expect(formatDose({ kind: 'hold', seconds: 30 })).toBe('30 s hold');
    expect(formatPrescription(3, { kind: 'reps', reps: 12 }, true)).toBe('3 × 12 reps per side');
    expect(formatPrescription(2, { kind: 'hold', seconds: 45 }, false)).toBe('2 × 45 s hold');
  });

  it('formats seconds', () => {
    expect(formatSeconds(45)).toBe('45 s');
    expect(formatSeconds(60)).toBe('1 min');
    expect(formatSeconds(90)).toBe('1 min 30 s');
  });
});
