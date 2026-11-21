import { DEFAULT_TIMEZONE, isValidTimezone, localDate } from './dates'
import { userKey, type Item } from './db'
import type { Context } from './router'

export interface Profile {
  userId: string
  email: string | null
  name: string | null
  picture: string | null
  /** Points balance: everything earned minus everything redeemed. */
  points: number
  /** Decides where one day ends and the next begins for this user. */
  timezone: string
  /** The household whose schedules this user can see and edit. */
  householdId: string
  createdAt: string
}

export const toProfile = (userId: string, item: Item): Profile => ({
  userId,
  email: (item.email as string | undefined) ?? null,
  name: (item.name as string | undefined) ?? null,
  picture: (item.picture as string | undefined) ?? null,
  points: typeof item.points === 'number' ? item.points : 0,
  timezone: isValidTimezone(item.timezone) ? item.timezone : DEFAULT_TIMEZONE,
  householdId: typeof item.householdId === 'string' ? item.householdId : userId,
  createdAt: item.createdAt as string,
})

/** The caller's profile, created from the token's claims the first time they are seen. */
export async function loadProfile({ userId, claims, db, now }: Pick<Context, 'userId' | 'claims' | 'db' | 'now'>): Promise<Profile> {
  const pk = userKey(userId)
  const existing = await db.get(pk, 'PROFILE')
  if (existing) return toProfile(userId, existing)

  const item: Item = {
    PK: pk,
    SK: 'PROFILE',
    email: claims.email,
    name: claims.name,
    picture: claims.picture,
    points: 0,
    timezone: DEFAULT_TIMEZONE,
    householdId: userId,
    createdAt: now().toISOString(),
  }
  // Two first calls can race; the loser reads what the winner wrote.
  const created = await db.putIfAbsent(item)
  return toProfile(userId, created ? item : (await db.get(pk, 'PROFILE')) ?? item)
}

/** Today's date for this user. */
export const today = (profile: Profile, now: () => Date) => localDate(now(), profile.timezone)
