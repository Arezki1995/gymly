type Props = { value?: number; onChange: (value: number | undefined) => void };

/** Optional "Felt tight?" 1–5 rating. Tapping the selected value clears it. */
export function TightnessRating({ value, onChange }: Props) {
  return (
    <fieldset className="mt-4">
      <legend className="text-sm text-slate-500 dark:text-slate-400">
        Felt tight? <span className="text-xs">(optional, 1 = loose, 5 = very tight)</span>
      </legend>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            aria-label={`Tightness ${n} of 5`}
            onClick={() => onChange(value === n ? undefined : n)}
            className={`min-h-11 rounded-xl border text-base font-semibold ${
              value === n
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-300 dark:border-slate-700'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
