/** Calendar dates are `YYYY-MM-DD` strings in the user's own timezone. */

export const DEFAULT_TIMEZONE = 'America/Chicago'

export function isValidTimezone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || tz === '') return false
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** The calendar date at `now` in the given timezone. */
export function localDate(now: Date, timezone: string): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

const toUtc = (date: string) => new Date(`${date}T00:00:00Z`)
const fromUtc = (d: Date) => d.toISOString().slice(0, 10)

export function isValidDate(date: unknown): date is string {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const d = toUtc(date)
  return !Number.isNaN(d.getTime()) && fromUtc(d) === date
}

export function addDays(date: string, days: number): string {
  const d = toUtc(date)
  d.setUTCDate(d.getUTCDate() + days)
  return fromUtc(d)
}

export const PERIODS = ['week', 'month', 'year'] as const
export type Period = (typeof PERIODS)[number]

export const isPeriod = (p: unknown): p is Period => PERIODS.includes(p as Period)

/** The calendar week (Monday to Sunday), month or year that contains `today`. */
export function periodRange(period: Period, today: string): { from: string; to: string } {
  const [y, m] = today.split('-').map(Number)
  if (period === 'week') {
    const dow = (toUtc(today).getUTCDay() + 6) % 7 // Monday = 0
    const from = addDays(today, -dow)
    return { from, to: addDays(from, 6) }
  }
  if (period === 'month') {
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
    const mm = String(m).padStart(2, '0')
    return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(last).padStart(2, '0')}` }
  }
  return { from: `${y}-01-01`, to: `${y}-12-31` }
}
