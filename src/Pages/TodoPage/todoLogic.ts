import type { CompleteResult, Feel, Goal, HeatmapDay, Size } from './types'

export const SIZES: Size[] = ['small', 'medium', 'large']
export const SIZE_LETTER: Record<Size, string> = { small: 'S', medium: 'M', large: 'L' }
/** Shown on buttons and chips only. The API decides what is actually awarded. */
export const SIZE_POINTS: Record<Size, number> = { small: 1, medium: 2, large: 3 }

export const FEELS: { value: Feel; label: string; icon: string }[] = [
  { value: 'energized', label: 'Energized', icon: '⚡' },
  { value: 'neutral', label: 'Neutral', icon: '➖' },
  { value: 'drained', label: 'Drained', icon: '🪫' },
]

export const points = (n: number) => `${n} ${n === 1 ? 'point' : 'points'}`

const BONUS_LABEL = {
  'streak-week': 'weekly streak bonus',
  'streak-month': 'monthly streak bonus',
  'one-more': 'one-more bonus',
} as const

/** What a completion earned, as one line: "+2 points · 7-day streak · +10 weekly streak bonus". */
export function awardMessage(result: Pick<CompleteResult, 'awards' | 'streak'>): string {
  const base = result.awards.filter(a => a.reason === 'task' || a.reason === 'daily').reduce((sum, a) => sum + a.amount, 0)
  const parts = [`+${points(base)}`]
  if (result.streak && result.streak.current >= 2) parts.push(`${result.streak.current}-day streak`)
  for (const award of result.awards) {
    if (award.reason === 'task' || award.reason === 'daily') continue
    parts.push(`+${award.amount} ${BONUS_LABEL[award.reason]}`)
  }
  return parts.join(' · ')
}

/** Items grouped under each goal, in goal order, then the ones with no goal (or a deleted goal). */
export function groupByGoal<T extends { goalId: string | null }>(items: T[], goals: Goal[]): { goal: Goal | null; items: T[] }[] {
  const known = new Set(goals.map(g => g.id))
  return [
    ...goals.map(goal => ({ goal, items: items.filter(i => i.goalId === goal.id) })),
    { goal: null, items: items.filter(i => i.goalId === null || !known.has(i.goalId)) },
  ]
}

/** How far the balance is towards a reward, from 0 to 1, and how many points are missing. */
export function rewardProgress(balance: number, cost: number): { fraction: number; toGo: number } {
  return { fraction: Math.max(0, Math.min(1, balance / cost)), toGo: Math.max(0, cost - balance) }
}

const toUtc = (date: string) => new Date(`${date}T00:00:00Z`)
const toDate = (d: Date) => d.toISOString().slice(0, 10)

export interface HeatCell {
  date: string
  completions: number
}

/**
 * The days from `from` to `to` as columns of one week each, Monday first.
 * Days outside the range are null, so every column has seven cells.
 */
export function heatmapWeeks(from: string, to: string, days: HeatmapDay[]): (HeatCell | null)[][] {
  const counts = new Map(days.map(d => [d.date, d.completions]))
  const weeks: (HeatCell | null)[][] = []
  const end = toUtc(to).getTime()
  for (let d = toUtc(from); d.getTime() <= end; d = new Date(d.getTime() + 86_400_000)) {
    const weekday = (d.getUTCDay() + 6) % 7 // Monday = 0
    if (weeks.length === 0 || weekday === 0) weeks.push(Array<HeatCell | null>(7).fill(null))
    const date = toDate(d)
    weeks[weeks.length - 1][weekday] = { date, completions: counts.get(date) ?? 0 }
  }
  return weeks
}

/** 0 (nothing) to 4 (a lot), for shading a heatmap cell. */
export function heatLevel(completions: number): 0 | 1 | 2 | 3 | 4 {
  if (completions <= 0) return 0
  if (completions === 1) return 1
  if (completions <= 3) return 2
  if (completions <= 5) return 3
  return 4
}

/** "Saturday, November 21" for a YYYY-MM-DD date. */
export const formatDay = (date: string) =>
  toUtc(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })

/** "Nov 21" for a YYYY-MM-DD date. */
export const formatShortDay = (date: string) =>
  toUtc(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

export const errorMessage = (err: unknown, fallback = 'Something went wrong. Try again.') =>
  err instanceof Error && err.message ? err.message : fallback
