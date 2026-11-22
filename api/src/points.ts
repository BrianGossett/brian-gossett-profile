import { addDays } from './dates'

/**
 * All points math lives here, as pure functions.
 *
 * Rules (agreed 2026-11-21):
 * - Completing a task or a daily earns its size's base points: small 1, medium 2, large 3.
 * - Each daily has its own streak: it grows by one for each day in a row the daily
 *   is completed, and starts over after a missed day.
 * - Every 7th day in a row earns a weekly streak bonus, and every 30th day in a row a
 *   monthly streak bonus. Each bonus is small 5, medium 10, large 15, by the daily's size.
 * - "One more": once every daily is done for the day, the next one-off task completed
 *   that day counts double: a bonus equal to its base points (1, 2 or 3). Once per day,
 *   and only for users who have at least one daily.
 * - No other bonuses yet.
 * - Rewards cost whatever the user set; redeeming needs at least that many points.
 */

export const SIZES = ['small', 'medium', 'large'] as const
export type Size = (typeof SIZES)[number]
export const isSize = (s: unknown): s is Size => SIZES.includes(s as Size)

export const BASE_POINTS: Record<Size, number> = { small: 1, medium: 2, large: 3 }
export const STREAK_BONUS: Record<Size, number> = { small: 5, medium: 10, large: 15 }

export const WEEKLY_STREAK_DAYS = 7
export const MONTHLY_STREAK_DAYS = 30

export type AwardReason = 'task' | 'daily' | 'streak-week' | 'streak-month' | 'one-more'

/** How a completed task felt. Optional, and worth no points. */
export const FEELS = ['energized', 'neutral', 'drained'] as const
export type Feel = (typeof FEELS)[number]
export const isFeel = (f: unknown): f is Feel => FEELS.includes(f as Feel)

export interface Award {
  reason: AwardReason
  amount: number
}

export interface Streak {
  /** Days in a row, counting `lastDate`. */
  current: number
  longest: number
  /** The last date the daily was completed. */
  lastDate: string
}

/** The streak after completing a daily on `date`. */
export function nextStreak(prev: Streak | undefined, date: string): Streak {
  if (!prev) return { current: 1, longest: 1, lastDate: date }
  // Completing again on the same day changes nothing.
  if (prev.lastDate === date) return prev
  const current = prev.lastDate === addDays(date, -1) ? prev.current + 1 : 1
  return { current, longest: Math.max(prev.longest, current), lastDate: date }
}

/**
 * The streak as of `today`: a streak last extended before yesterday is over,
 * even though nothing has rewritten the stored record yet.
 */
export function currentStreak(streak: Streak | undefined, today: string): number {
  if (!streak) return 0
  return streak.lastDate === today || streak.lastDate === addDays(today, -1) ? streak.current : 0
}

/** Bonuses earned by reaching a streak of `current` days. */
export function streakBonuses(size: Size, current: number): Award[] {
  const awards: Award[] = []
  if (current > 0 && current % WEEKLY_STREAK_DAYS === 0) {
    awards.push({ reason: 'streak-week', amount: STREAK_BONUS[size] })
  }
  if (current > 0 && current % MONTHLY_STREAK_DAYS === 0) {
    awards.push({ reason: 'streak-month', amount: STREAK_BONUS[size] })
  }
  return awards
}

/** Everything earned by completing a one-off task. */
export function taskAwards(size: Size, oneMore = false): Award[] {
  return [
    { reason: 'task', amount: BASE_POINTS[size] },
    // "One more" makes the task count double.
    ...(oneMore ? [{ reason: 'one-more' as const, amount: BASE_POINTS[size] }] : []),
  ]
}

/** Everything earned by completing a daily on `date`, and its streak afterwards. */
export function dailyAwards(size: Size, prev: Streak | undefined, date: string): { awards: Award[]; streak: Streak } {
  const streak = nextStreak(prev, date)
  return {
    awards: [{ reason: 'daily', amount: BASE_POINTS[size] }, ...streakBonuses(size, streak.current)],
    streak,
  }
}

export const total = (awards: Award[]) => awards.reduce((sum, a) => sum + a.amount, 0)

export function canRedeem(balance: number, cost: number): boolean {
  return Number.isInteger(cost) && cost > 0 && balance >= cost
}
