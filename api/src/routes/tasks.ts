import { isValidDate } from '../dates'
import { ConditionFailedError, userKey, type Db, type Item, type TxOp } from '../db'
import { HttpError, json, parseBody, requireText } from '../http'
import { currentStreak, dailyAwards, isSize, taskAwards, total, type Award, type Size, type Streak } from '../points'
import { loadProfile, today } from '../profile'
import type { Handler, Route } from '../router'

/**
 * A task is done once. A daily is a task that comes back every day and has a streak.
 * Both are managed through /tasks; the ID's prefix says which it is.
 */
export type Kind = 'task' | 'daily'

const kindOf = (id: string): Kind | undefined => (id.startsWith('t_') ? 'task' : id.startsWith('d_') ? 'daily' : undefined)
export const itemSk = (id: string) => `${kindOf(id) === 'daily' ? 'DAILY' : 'TASK'}#${id}`
export const doneSk = (date: string, id: string) => `DONE#${date}#${id}`
const streakSk = (id: string) => `STREAK#${id}`

export const toTask = (item: Item) => ({
  id: item.id as string,
  kind: item.kind as Kind,
  title: item.title as string,
  size: item.size as Size,
  goalId: (item.goalId as string | undefined) ?? null,
  dueDate: (item.dueDate as string | undefined) ?? null,
  scheduleId: (item.scheduleId as string | undefined) ?? null,
  status: (item.status as string | undefined) ?? 'open',
  completedDate: (item.completedDate as string | undefined) ?? null,
  createdAt: item.createdAt as string,
})

const toStreak = (item: Item | undefined): Streak | undefined =>
  item ? { current: item.current as number, longest: item.longest as number, lastDate: item.lastDate as string } : undefined

async function readFields(db: Db, userId: string, body: Record<string, unknown>, partial: boolean) {
  const fields: Record<string, unknown> = {}
  if (!partial || body.title !== undefined) fields.title = requireText(body.title, 'title')
  if (!partial || body.size !== undefined) {
    if (!isSize(body.size)) throw new HttpError(400, 'size must be small, medium or large')
    fields.size = body.size
  }
  if (body.goalId !== undefined) {
    if (body.goalId === null) fields.goalId = undefined
    else {
      if (typeof body.goalId !== 'string') throw new HttpError(400, 'goalId must be a string')
      if (!(await db.get(userKey(userId), `GOAL#${body.goalId}`))) throw new HttpError(400, 'goalId is not one of your goals')
      fields.goalId = body.goalId
    }
  }
  if (body.dueDate !== undefined) {
    if (body.dueDate !== null && !isValidDate(body.dueDate)) throw new HttpError(400, 'dueDate must be YYYY-MM-DD')
    fields.dueDate = body.dueDate ?? undefined
  }
  return fields
}

/** Builds a new task or daily item. Shared with schedules, which create dailies. */
export function newItem(userId: string, kind: Kind, id: string, fields: Record<string, unknown>, createdAt: string): Item {
  const fullId = `${kind === 'daily' ? 'd' : 't'}_${id}`
  return { PK: userKey(userId), SK: itemSk(fullId), id: fullId, kind, status: 'open', createdAt, ...fields }
}

const listTasks: Handler = async ({ userId, db }) => {
  const pk = userKey(userId)
  const [tasks, dailies] = await Promise.all([db.query(pk, { prefix: 'TASK#' }), db.query(pk, { prefix: 'DAILY#' })])
  return json(200, { tasks: tasks.map(toTask), dailies: dailies.map(toTask) })
}

const createTask: Handler = async ({ userId, db, event, now, newId }) => {
  const body = parseBody(event)
  const repeat = body.repeat ?? 'none'
  if (repeat !== 'none' && repeat !== 'daily') throw new HttpError(400, 'repeat must be none or daily')
  const fields = await readFields(db, userId, body, false)
  const item = newItem(userId, repeat === 'daily' ? 'daily' : 'task', newId(), fields, now().toISOString())
  await db.put(item)
  return json(201, toTask(item))
}

const updateTask: Handler = async ({ userId, db, event, params }) => {
  if (!kindOf(params.id)) throw new HttpError(404, 'Task not found')
  const item = await db.get(userKey(userId), itemSk(params.id))
  if (!item) throw new HttpError(404, 'Task not found')
  const updated = { ...item, ...(await readFields(db, userId, parseBody(event), true)) }
  await db.put(updated)
  return json(200, toTask(updated))
}

/** Deletes the task or daily (and a daily's streak). Points already earned are kept. */
const deleteTask: Handler = async ({ userId, db, params }) => {
  if (!kindOf(params.id)) return json(204, null)
  const pk = userKey(userId)
  await db.transact([
    { type: 'delete', pk, sk: itemSk(params.id) },
    { type: 'delete', pk, sk: streakSk(params.id) },
  ])
  return json(204, null)
}

/**
 * Completes a task or daily for today and awards its points.
 * A task can be completed once ever; a daily once per day.
 */
const completeTask: Handler = async ctx => {
  const { userId, db, params, now, newId } = ctx
  const kind = kindOf(params.id)
  if (!kind) throw new HttpError(404, 'Task not found')
  const pk = userKey(userId)
  const profile = await loadProfile(ctx)
  const date = today(profile, now)

  const item = await db.get(pk, itemSk(params.id))
  if (!item) throw new HttpError(404, 'Task not found')
  const size = item.size as Size
  if (kind === 'task' && item.status === 'done') throw new HttpError(409, 'This task is already done')

  let awards: Award[]
  let streak: Streak | undefined
  const ops: TxOp[] = []
  if (kind === 'daily') {
    const result = dailyAwards(size, toStreak(await db.get(pk, streakSk(params.id))), date)
    awards = result.awards
    streak = result.streak
    ops.push({ type: 'put', item: { PK: pk, SK: streakSk(params.id), dailyId: params.id, ...streak } })
  } else {
    awards = taskAwards(size)
    ops.push({ type: 'put', item: { ...item, status: 'done', completedDate: date } })
  }

  const points = total(awards)
  const at = now().toISOString()
  ops.push(
    // The completion record is what makes "once per day" hold: a second one cannot be written.
    {
      type: 'put',
      ifAbsent: true,
      item: { PK: pk, SK: doneSk(date, params.id), itemId: params.id, kind, date, size, points, goalId: item.goalId, title: item.title, completedAt: at },
    },
    ...awards.map((award, i): TxOp => ({
      type: 'put',
      item: { PK: pk, SK: `LEDGER#${date}#${at}#${newId()}#${i}`, date, amount: award.amount, reason: award.reason, itemId: params.id, at },
    })),
    { type: 'add', pk, sk: 'PROFILE', field: 'points', amount: points },
  )

  try {
    await db.transact(ops)
  } catch (err) {
    if (err instanceof ConditionFailedError) throw new HttpError(409, kind === 'daily' ? 'Already completed today' : 'This task is already done')
    throw err
  }

  return json(200, {
    id: params.id,
    date,
    points,
    awards,
    streak: streak ? { current: streak.current, longest: streak.longest } : null,
    balance: profile.points + points,
  })
}

/** Everything for the home screen: today's dailies with streaks, open tasks, and points. */
const getToday: Handler = async ctx => {
  const { userId, db, now } = ctx
  const pk = userKey(userId)
  const profile = await loadProfile(ctx)
  const date = today(profile, now)
  const [tasks, dailies, streaks, done] = await Promise.all([
    db.query(pk, { prefix: 'TASK#' }),
    db.query(pk, { prefix: 'DAILY#' }),
    db.query(pk, { prefix: 'STREAK#' }),
    db.query(pk, { prefix: `DONE#${date}#` }),
  ])
  const doneIds = new Set(done.map(d => d.itemId as string))
  const streakById = new Map(streaks.map(s => [s.dailyId as string, toStreak(s)]))

  return json(200, {
    date,
    timezone: profile.timezone,
    balance: profile.points,
    earnedToday: done.reduce((sum, d) => sum + (d.points as number), 0),
    dailies: dailies.map(d => {
      const streak = streakById.get(d.id as string)
      return {
        ...toTask(d),
        doneToday: doneIds.has(d.id as string),
        streak: { current: currentStreak(streak, date), longest: streak?.longest ?? 0 },
      }
    }),
    // Open tasks, plus the ones finished today so they can be shown ticked off.
    tasks: tasks.map(toTask).filter(t => t.status !== 'done' || t.completedDate === date),
  })
}

export const taskRoutes: Route[] = [
  { method: 'GET', path: '/today', handler: getToday },
  { method: 'GET', path: '/tasks', handler: listTasks },
  { method: 'POST', path: '/tasks', handler: createTask },
  { method: 'PATCH', path: '/tasks/{id}', handler: updateTask },
  { method: 'DELETE', path: '/tasks/{id}', handler: deleteTask },
  { method: 'POST', path: '/tasks/{id}/complete', handler: completeTask },
]
