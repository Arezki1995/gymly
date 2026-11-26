import { useNavigate } from 'react-router-dom';

/** "‹ Label" back button: goes back in history, or to `fallback` on a fresh load. */
export function BackLink({ label, fallback }: { label: string; fallback: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate(fallback))}
      className="-ml-2 mb-2 flex min-h-11 items-center gap-1 px-2 text-sm font-medium text-brand-600 dark:text-brand-400"
    >
      <span aria-hidden>‹</span> {label}
    </button>
  );
}
