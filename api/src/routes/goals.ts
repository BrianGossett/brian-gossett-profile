import { userKey, type Item } from '../db'
import { HttpError, json, parseBody, requireText } from '../http'
import type { Handler, Route } from '../router'

/** A goal is a named group that tasks and dailies can belong to. It earns no points itself. */
const toGoal = (item: Item) => ({ id: item.id, name: item.name, createdAt: item.createdAt })

const sk = (id: string) => `GOAL#${id}`

const listGoals: Handler = async ({ userId, db }) => {
  const items = await db.query(userKey(userId), { prefix: 'GOAL#' })
  return json(200, { goals: items.map(toGoal) })
}

const createGoal: Handler = async ({ userId, db, event, now, newId }) => {
  const name = requireText(parseBody(event).name, 'name')
  const id = newId()
  const item: Item = { PK: userKey(userId), SK: sk(id), id, name, createdAt: now().toISOString() }
  await db.put(item)
  return json(201, toGoal(item))
}

const updateGoal: Handler = async ({ userId, db, event, params }) => {
  const name = requireText(parseBody(event).name, 'name')
  const item = await db.get(userKey(userId), sk(params.id))
  if (!item) throw new HttpError(404, 'Goal not found')
  const updated = { ...item, name }
  await db.put(updated)
  return json(200, toGoal(updated))
}

/** Deletes the goal. Tasks that pointed at it keep working and simply have no goal. */
const deleteGoal: Handler = async ({ userId, db, params }) => {
  await db.delete(userKey(userId), sk(params.id))
  return json(204, null)
}

export const goalRoutes: Route[] = [
  { method: 'GET', path: '/goals', handler: listGoals },
  { method: 'POST', path: '/goals', handler: createGoal },
  { method: 'PATCH', path: '/goals/{id}', handler: updateGoal },
  { method: 'DELETE', path: '/goals/{id}', handler: deleteGoal },
]
