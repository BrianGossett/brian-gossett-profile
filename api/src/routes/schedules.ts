import { householdKey, type Item } from '../db'
import { HttpError, json, parseBody, requireText } from '../http'
import { isSize, type Size } from '../points'
import { loadProfile, type Profile } from '../profile'
import type { Context, Handler, Route } from '../router'
import { newItem, toTask } from './tasks'

/**
 * A schedule is a named routine: a list of dailies. Applying one creates those
 * dailies for the caller. Schedules belong to a household; for now every user
 * has a household of their own.
 */
interface ScheduleItem {
  title: string
  size: Size
}

/** Example routines to start from. */
export const TEMPLATES: { id: string; name: string; items: ScheduleItem[] }[] = [
  {
    id: 'morning',
    name: 'Morning routine',
    items: [
      { title: 'Get up with the alarm', size: 'small' },
      { title: 'Brush teeth', size: 'small' },
      { title: 'Make the bed', size: 'small' },
      { title: 'Stretch for 10 minutes', size: 'medium' },
    ],
  },
  {
    id: 'evening',
    name: 'Evening wind-down',
    items: [
      { title: 'Tidy up for 10 minutes', size: 'small' },
      { title: 'Plan tomorrow', size: 'small' },
      { title: 'Brush teeth', size: 'small' },
      { title: 'Lights out on time', size: 'medium' },
    ],
  },
  {
    id: 'workday',
    name: 'Workday focus',
    items: [
      { title: 'Do the most important task first', size: 'large' },
      { title: 'Clear the inbox', size: 'medium' },
      { title: 'Walk for 20 minutes', size: 'medium' },
    ],
  },
]

const MAX_ITEMS = 30
const sk = (id: string) => `SCHED#${id}`
const toSchedule = (item: Item) => ({ id: item.id, name: item.name, items: item.items, createdAt: item.createdAt })

function requireItems(value: unknown): ScheduleItem[] {
  if (!Array.isArray(value) || value.length === 0) throw new HttpError(400, 'items must be a non-empty list')
  if (value.length > MAX_ITEMS) throw new HttpError(400, `a schedule can have at most ${MAX_ITEMS} items`)
  return value.map((raw, i) => {
    const entry = (raw ?? {}) as Record<string, unknown>
    if (!isSize(entry.size)) throw new HttpError(400, `items[${i}].size must be small, medium or large`)
    return { title: requireText(entry.title, `items[${i}].title`), size: entry.size }
  })
}

/**
 * The household the caller may use, after checking they are a member of it.
 * A user's own household is created the first time they need it.
 */
async function household(ctx: Context): Promise<{ profile: Profile; pk: string }> {
  const profile = await loadProfile(ctx)
  const pk = householdKey(profile.householdId)
  const memberSk = `MEMBER#${ctx.userId}`
  if (profile.householdId === ctx.userId) {
    await ctx.db.putIfAbsent({ PK: pk, SK: memberSk, userId: ctx.userId, role: 'owner', joinedAt: ctx.now().toISOString() })
  } else if (!(await ctx.db.get(pk, memberSk))) {
    throw new HttpError(403, 'You are not a member of this household')
  }
  return { profile, pk }
}

const listSchedules: Handler = async ctx => {
  const { pk } = await household(ctx)
  const items = await ctx.db.query(pk, { prefix: 'SCHED#' })
  return json(200, { schedules: items.map(toSchedule), templates: TEMPLATES })
}

/** Creates a schedule from `{ name, items }`, or from an example with `{ templateId }`. */
const createSchedule: Handler = async ctx => {
  const { pk } = await household(ctx)
  const body = parseBody(ctx.event)
  let name: string
  let items: ScheduleItem[]
  if (body.templateId !== undefined) {
    const template = TEMPLATES.find(t => t.id === body.templateId)
    if (!template) throw new HttpError(400, 'templateId is not one of the example schedules')
    name = body.name !== undefined ? requireText(body.name, 'name') : template.name
    items = template.items
  } else {
    name = requireText(body.name, 'name')
    items = requireItems(body.items)
  }
  const id = ctx.newId()
  const item: Item = { PK: pk, SK: sk(id), id, name, items, createdBy: ctx.userId, createdAt: ctx.now().toISOString() }
  await ctx.db.put(item)
  return json(201, toSchedule(item))
}

const updateSchedule: Handler = async ctx => {
  const { pk } = await household(ctx)
  const body = parseBody(ctx.event)
  const item = await ctx.db.get(pk, sk(ctx.params.id))
  if (!item) throw new HttpError(404, 'Schedule not found')
  const updated = {
    ...item,
    ...(body.name !== undefined ? { name: requireText(body.name, 'name') } : {}),
    ...(body.items !== undefined ? { items: requireItems(body.items) } : {}),
  }
  await ctx.db.put(updated)
  return json(200, toSchedule(updated))
}

/** Deletes the schedule. Dailies already created from it are kept. */
const deleteSchedule: Handler = async ctx => {
  const { pk } = await household(ctx)
  await ctx.db.delete(pk, sk(ctx.params.id))
  return json(204, null)
}

/** Creates one daily for the caller per item in the schedule. */
const applySchedule: Handler = async ctx => {
  const { pk } = await household(ctx)
  const schedule = await ctx.db.get(pk, sk(ctx.params.id))
  if (!schedule) throw new HttpError(404, 'Schedule not found')
  const createdAt = ctx.now().toISOString()
  const dailies = (schedule.items as ScheduleItem[]).map(entry =>
    newItem(ctx.userId, 'daily', ctx.newId(), { title: entry.title, size: entry.size, scheduleId: schedule.id }, createdAt),
  )
  await ctx.db.transact(dailies.map(item => ({ type: 'put' as const, item })))
  return json(201, { dailies: dailies.map(toTask) })
}

export const scheduleRoutes: Route[] = [
  { method: 'GET', path: '/schedules', handler: listSchedules },
  { method: 'POST', path: '/schedules', handler: createSchedule },
  { method: 'PUT', path: '/schedules/{id}', handler: updateSchedule },
  { method: 'DELETE', path: '/schedules/{id}', handler: deleteSchedule },
  { method: 'POST', path: '/schedules/{id}/apply', handler: applySchedule },
]
