import { userKey } from '../db'
import { HttpError, json, parseBody } from '../http'
import type { Handler, Route } from '../router'

/**
 * Study progress for one deck. The app decides what progress contains; the API
 * stores it as one JSON object per deck. `default` is allowed here: the built-in
 * deck has progress too, even though the deck itself isn't stored.
 */
const MAX_PROGRESS_BYTES = 100_000

const sk = (deckId: string) => `PROG#${deckId}`

function requireProgressDeckId(value: string): string {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(value)) throw new HttpError(400, 'deck id must be 1 to 64 letters, digits, hyphens or underscores')
  return value
}

/** The saved progress, or `null` when nothing has been saved for this deck yet. */
const getProgress: Handler = async ({ userId, db, params }) => {
  const deckId = requireProgressDeckId(params.deckId)
  const item = await db.get(userKey(userId), sk(deckId))
  return json(200, { deckId, progress: item?.progress ?? null, updatedAt: item?.updatedAt ?? null })
}

const putProgress: Handler = async ({ userId, db, event, params, now }) => {
  const deckId = requireProgressDeckId(params.deckId)
  const { progress } = parseBody(event)
  if (progress === null || typeof progress !== 'object' || Array.isArray(progress)) {
    throw new HttpError(400, 'progress must be an object')
  }
  if (Buffer.byteLength(JSON.stringify(progress), 'utf8') > MAX_PROGRESS_BYTES) {
    throw new HttpError(413, 'progress is too large to store')
  }
  const updatedAt = now().toISOString()
  await db.put({ PK: userKey(userId), SK: sk(deckId), deckId, progress, updatedAt })
  return json(200, { deckId, progress, updatedAt })
}

export const progressRoutes: Route[] = [
  { method: 'GET', path: '/progress/{deckId}', handler: getProgress },
  { method: 'PUT', path: '/progress/{deckId}', handler: putProgress },
]
