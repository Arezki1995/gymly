/**
 * End-of-timer feedback: a short beep (Web Audio, no sound files) and a vibration.
 * Both fail silently where unsupported (e.g. iOS has no Vibration API).
 */

let ctx: AudioContext | undefined;

/** Call from a user gesture (tap) so mobile browsers allow audio later. */
export function unlockAudio(): void {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
}

function beep(frequency: number, ms: number, delayMs = 0): void {
  if (!ctx) return;
  const t = ctx.currentTime + delayMs / 1000;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.4, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + ms / 1000 + 0.02);
}

function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
}

export type FeedbackOptions = { sound: boolean; vibration: boolean };

/** A hold or rest has finished. */
export function signalEnd({ sound, vibration }: FeedbackOptions): void {
  if (sound) {
    beep(880, 180);
    beep(880, 180, 250);
  }
  if (vibration) vibrate([200, 100, 200]);
}

/** A short "go" cue at the end of a get-ready countdown. */
export function signalGo({ sound, vibration }: FeedbackOptions): void {
  if (sound) beep(660, 120);
  if (vibration) vibrate(80);
}
