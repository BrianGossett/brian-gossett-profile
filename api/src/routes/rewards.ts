import { ConditionFailedError, userKey, type Item } from '../db'
import { HttpError, json, parseBody, requireText } from '../http'
import { canRedeem } from '../points'
import { loadProfile, today } from '../profile'
import type { Handler, Route } from '../router'

/** A reward is something the user can spend points on. They set its cost themselves. */
const toReward = (item: Item) => ({ id: item.id, name: item.name, cost: item.cost, createdAt: item.createdAt })

const sk = (id: string) => `REWARD#${id}`

function requireCost(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 1_000_000) {
    throw new HttpError(400, 'cost must be a whole number of points, at least 1')
  }
  return value
}

const listRewards: Handler = async ({ userId, db }) => {
  const items = await db.query(userKey(userId), { prefix: 'REWARD#' })
  return json(200, { rewards: items.map(toReward) })
}

const createReward: Handler = async ({ userId, db, event, now, newId }) => {
  const body = parseBody(event)
  const id = newId()
  const item: Item = {
    PK: userKey(userId),
    SK: sk(id),
    id,
    name: requireText(body.name, 'name'),
    cost: requireCost(body.cost),
    createdAt: now().toISOString(),
  }
  await db.put(item)
  return json(201, toReward(item))
}

const updateReward: Handler = async ({ userId, db, event, params }) => {
  const body = parseBody(event)
  const item = await db.get(userKey(userId), sk(params.id))
  if (!item) throw new HttpError(404, 'Reward not found')
  const updated = {
    ...item,
    ...(body.name !== undefined ? { name: requireText(body.name, 'name') } : {}),
    ...(body.cost !== undefined ? { cost: requireCost(body.cost) } : {}),
  }
  await db.put(updated)
  return json(200, toReward(updated))
}

const deleteReward: Handler = async ({ userId, db, params }) => {
  await db.delete(userKey(userId), sk(params.id))
  return json(204, null)
}

/** Spends points on a reward. Refused if the balance is lower than the cost. */
const redeemReward: Handler = async ctx => {
  const { userId, db, params, now, newId } = ctx
  const pk = userKey(userId)
  const profile = await loadProfile(ctx)
  const reward = await db.get(pk, sk(params.id))
  if (!reward) throw new HttpError(404, 'Reward not found')
  const cost = reward.cost as number
  const notEnough = new HttpError(409, `Not enough points: this costs ${cost} and you have ${profile.points}`)
  if (!canRedeem(profile.points, cost)) throw notEnough

  const date = today(profile, now)
  const at = now().toISOString()
  const id = newId()
  try {
    await db.transact([
      // `min: 0` re-checks the balance at write time, so two redemptions at once cannot overspend.
      { type: 'add', pk, sk: 'PROFILE', field: 'points', amount: -cost, min: 0 },
      { type: 'put', item: { PK: pk, SK: `REDEEM#${date}#${at}#${id}`, id, rewardId: reward.id, name: reward.name, cost, date, at } },
      { type: 'put', item: { PK: pk, SK: `LEDGER#${date}#${at}#${id}`, date, amount: -cost, reason: 'redeem', itemId: reward.id, at } },
    ])
  } catch (err) {
    if (err instanceof ConditionFailedError) throw notEnough
    throw err
  }
  return json(200, { rewardId: reward.id, name: reward.name, cost, balance: profile.points - cost })
}

export const rewardRoutes: Route[] = [
  { method: 'GET', path: '/rewards', handler: listRewards },
  { method: 'POST', path: '/rewards', handler: createReward },
  { method: 'PATCH', path: '/rewards/{id}', handler: updateReward },
  { method: 'DELETE', path: '/rewards/{id}', handler: deleteReward },
  { method: 'POST', path: '/rewards/{id}/redeem', handler: redeemReward },
]
