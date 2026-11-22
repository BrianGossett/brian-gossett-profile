/** Timing for a round of Matching. */

/** Seconds added to a round's time for each wrong match. */
export const WRONG_MATCH_PENALTY_SECONDS = 5

/** Seconds since the first tile was clicked, plus the penalty for each wrong match. */
export function roundTime(startedAt: number, now: number, wrongMatches: number): number {
  return Math.max(0, now - startedAt) / 1000 + wrongMatches * WRONG_MATCH_PENALTY_SECONDS
}

/** Whether `time` beats the best so far. The first time recorded is always a best. */
export const isNewBest = (best: number | undefined, time: number) => best === undefined || time < best

/** `12.34` → "12.3s"; `65.2` → "1:05.2". */
export function formatSeconds(seconds: number): string {
  const tenths = Math.round(Math.max(0, seconds) * 10)
  const whole = Math.floor(tenths / 10)
  const tenth = tenths % 10
  if (whole < 60) return `${whole}.${tenth}s`
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}.${tenth}`
}

/** The current time in milliseconds. Kept here so components read the clock in one place. */
export const currentTime = (): number => Date.now()
