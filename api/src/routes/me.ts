import { isValidTimezone } from '../dates'
import { userKey } from '../db'
import { HttpError, json, parseBody } from '../http'
import { loadProfile } from '../profile'
import type { Handler, Route } from '../router'

/** Returns the caller's profile, creating it from the token's claims on first call. */
const getMe: Handler = async ctx => json(200, await loadProfile(ctx))

/** Changes the caller's timezone, the only profile setting they can edit. */
const patchMe: Handler = async ctx => {
  const { timezone } = parseBody(ctx.event)
  if (!isValidTimezone(timezone)) throw new HttpError(400, 'timezone must be a valid IANA timezone, like America/Chicago')
  const profile = await loadProfile(ctx)
  const item = await ctx.db.get(userKey(ctx.userId), 'PROFILE')
  await ctx.db.put({ ...item!, timezone })
  return json(200, { ...profile, timezone })
}

export const meRoutes: Route[] = [
  { method: 'GET', path: '/me', handler: getMe },
  { method: 'PATCH', path: '/me', handler: patchMe },
]
