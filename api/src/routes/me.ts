import { userKey, type Item } from '../db'
import { json } from '../http'
import type { Handler, Route } from '../router'

const toProfile = (userId: string, item: Item) => ({
  userId,
  email: item.email ?? null,
  name: item.name ?? null,
  picture: item.picture ?? null,
  createdAt: item.createdAt,
})

/** Returns the caller's profile, creating it from the token's claims on first call. */
const getMe: Handler = async ({ userId, claims, db, now }) => {
  const pk = userKey(userId)
  const existing = await db.get(pk, 'PROFILE')
  if (existing) return json(200, toProfile(userId, existing))

  const item: Item = {
    PK: pk,
    SK: 'PROFILE',
    email: claims.email,
    name: claims.name,
    picture: claims.picture,
    createdAt: now().toISOString(),
  }
  // Two first calls can race; the loser reads what the winner wrote.
  const created = await db.putIfAbsent(item)
  const profile = created ? item : (await db.get(pk, 'PROFILE')) ?? item
  return json(200, toProfile(userId, profile))
}

export const meRoutes: Route[] = [{ method: 'GET', path: '/me', handler: getMe }]
