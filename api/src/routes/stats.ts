import { addDays, isPeriod, periodRange } from '../dates'
import { userKey } from '../db'
import { HttpError, json } from '../http'
import { loadProfile, today } from '../profile'
import type { Context, Handler, Route } from '../router'

// Sort keys are DONE#<date>#<itemId>, so a date range is one query. '~' sorts after every ID.
const doneBetween = ({ userId, db }: Context, from: string, to: string) =>
  db.query(userKey(userId), { from: `DONE#${from}#`, to: `DONE#${to}#~` })

/** Points earned and spent, and completions, for this calendar week, month or year. */
const getSummary: Handler = async ctx => {
  const period = ctx.event.queryStringParameters?.period
  if (!isPeriod(period)) throw new HttpError(400, 'period must be week, month or year')
  const profile = await loadProfile(ctx)
  const { from, to } = periodRange(period, today(profile, ctx.now))
  const pk = userKey(ctx.userId)
  const [done, ledger, redeemed] = await Promise.all([
    doneBetween(ctx, from, to),
    ctx.db.query(pk, { from: `LEDGER#${from}#`, to: `LEDGER#${to}#~` }),
    ctx.db.query(pk, { from: `REDEEM#${from}#`, to: `REDEEM#${to}#~` }),
  ])

  const byGoal = new Map<string | null, { goalId: string | null; completions: number; points: number }>()
  for (const d of done) {
    const goalId = (d.goalId as string | undefined) ?? null
    const row = byGoal.get(goalId) ?? { goalId, completions: 0, points: 0 }
    row.completions += 1
    row.points += d.points as number
    byGoal.set(goalId, row)
  }
  const earnedBy = (reasons: string[]) =>
    ledger.filter(l => reasons.includes(l.reason as string)).reduce((sum, l) => sum + (l.amount as number), 0)

  return json(200, {
    period,
    from,
    to,
    earned: earnedBy(['task', 'daily', 'streak-week', 'streak-month']),
    streakBonuses: earnedBy(['streak-week', 'streak-month']),
    spent: redeemed.reduce((sum, r) => sum + (r.cost as number), 0),
    completions: done.length,
    redemptions: redeemed.length,
    byGoal: [...byGoal.values()],
  })
}

const HEATMAP_DAYS = 365

/** Completions per day for the last year. Days with nothing done are left out. */
const getHeatmap: Handler = async ctx => {
  const profile = await loadProfile(ctx)
  const to = today(profile, ctx.now)
  const from = addDays(to, -(HEATMAP_DAYS - 1))
  const days = new Map<string, { date: string; completions: number; points: number }>()
  for (const d of await doneBetween(ctx, from, to)) {
    const date = d.date as string
    const row = days.get(date) ?? { date, completions: 0, points: 0 }
    row.completions += 1
    row.points += d.points as number
    days.set(date, row)
  }
  return json(200, { from, to, days: [...days.values()] })
}

export const statsRoutes: Route[] = [
  { method: 'GET', path: '/summary', handler: getSummary },
  { method: 'GET', path: '/heatmap', handler: getHeatmap },
]
