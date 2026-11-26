import { useEffect, useState } from 'react';

/**
 * Keeps the screen awake while `enabled` is true. The browser drops the lock when the
 * page is hidden, so it is requested again whenever the page becomes visible.
 * Returns false when the Wake Lock API is unavailable (the session still works; the
 * user just has to keep the screen on).
 */
export function useWakeLock(enabled: boolean): boolean {
  const [supported] = useState(() => typeof navigator !== 'undefined' && 'wakeLock' in navigator);

  useEffect(() => {
    if (!enabled || !supported) return;
    let sentinel: WakeLockSentinel | undefined;
    let cancelled = false;

    const request = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const s = await navigator.wakeLock.request('screen');
        if (cancelled) void s.release();
        else sentinel = s;
      } catch {
        // Denied (e.g. battery saver). Nothing else to do.
      }
    };
    const onVisibility = () => void request();

    void request();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinel?.release().catch(() => undefined);
    };
  }, [enabled, supported]);

  return supported;
}
