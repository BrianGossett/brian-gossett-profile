import { userKey, type Item } from '../db'
import { HttpError, json, parseBody, requireText } from '../http'
import type { Handler, Route } from '../router'

/**
 * Custom flashcard decks, in the same `{ id, name, terms }` shape the app uses
 * (`Deck` in src/hooks/useDecks.ts). The built-in `default` deck lives in the
 * app and is never stored here.
 */
export interface Term {
  id: number
  category: string
  term: string
  definition: string
}

export interface Deck {
  id: string
  name: string
  terms: Term[]
}

export const MAX_TERMS = 2000
/** DynamoDB allows 400 KB per item; stay well under it. */
export const MAX_DECK_BYTES = 350_000

export const deckSk = (id: string) => `DECK#${id}`

export const toDeck = (item: Item): Deck => ({
  id: item.id as string,
  name: item.name as string,
  terms: item.terms as Term[],
})

export function requireDeckId(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(value)) {
    throw new HttpError(400, 'deck id must be 1 to 64 letters, digits, hyphens or underscores')
  }
  if (value === 'default') throw new HttpError(400, 'the default deck is built in and cannot be stored')
  return value
}

/** Checks a deck's name and terms, keeping only the fields a deck has. */
export function requireDeckContent(body: Record<string, unknown>, label = 'deck'): Pick<Deck, 'name' | 'terms'> {
  const name = requireText(body.name, `${label} name`)
  if (!Array.isArray(body.terms)) throw new HttpError(400, `${label} terms must be a list`)
  if (body.terms.length > MAX_TERMS) throw new HttpError(400, `${label} can have at most ${MAX_TERMS} terms`)
  const terms = body.terms.map((raw, i): Term => {
    const t = (raw ?? {}) as Record<string, unknown>
    if (typeof t.id !== 'number' || !Number.isFinite(t.id)) throw new HttpError(400, `${label} terms[${i}].id must be a number`)
    for (const field of ['term', 'definition', 'category'] as const) {
      if (typeof t[field] !== 'string') throw new HttpError(400, `${label} terms[${i}].${field} must be text`)
    }
    return { id: t.id, category: t.category as string, term: t.term as string, definition: t.definition as string }
  })
  if (Buffer.byteLength(JSON.stringify({ name, terms }), 'utf8') > MAX_DECK_BYTES) {
    throw new HttpError(413, `${label} is too large to store`)
  }
  return { name, terms }
}

export const deckItem = (userId: string, id: string, content: Pick<Deck, 'name' | 'terms'>, at: string, createdAt = at): Item => ({
  PK: userKey(userId),
  SK: deckSk(id),
  id,
  ...content,
  createdAt,
  updatedAt: at,
})

const listDecks: Handler = async ({ userId, db }) => {
  const items = await db.query(userKey(userId), { prefix: 'DECK#' })
  return json(200, { decks: items.map(toDeck) })
}

const getDeck: Handler = async ({ userId, db, params }) => {
  const item = await db.get(userKey(userId), deckSk(params.id))
  if (!item) throw new HttpError(404, 'Deck not found')
  return json(200, toDeck(item))
}

/** Creates a deck. The app makes deck IDs itself, so `id` may be given; otherwise one is generated. */
const createDeck: Handler = async ({ userId, db, event, now, newId }) => {
  const body = parseBody(event)
  const id = body.id === undefined ? newId() : requireDeckId(body.id)
  const item = deckItem(userId, id, requireDeckContent(body), now().toISOString())
  if (!(await db.putIfAbsent(item))) throw new HttpError(409, 'A deck with this id already exists')
  return json(201, toDeck(item))
}

/** Creates the deck or replaces its name and terms. Saving the same deck twice is harmless. */
const putDeck: Handler = async ({ userId, db, event, params, now }) => {
  const id = requireDeckId(params.id)
  const content = requireDeckContent(parseBody(event))
  const existing = await db.get(userKey(userId), deckSk(id))
  const item = deckItem(userId, id, content, now().toISOString(), existing?.createdAt as string | undefined)
  await db.put(item)
  return json(existing ? 200 : 201, toDeck(item))
}

/** Deletes the deck and its saved study progress. */
const deleteDeck: Handler = async ({ userId, db, params }) => {
  const pk = userKey(userId)
  await db.transact([
    { type: 'delete', pk, sk: deckSk(params.id) },
    { type: 'delete', pk, sk: `PROG#${params.id}` },
  ])
  return json(204, null)
}

export const deckRoutes: Route[] = [
  { method: 'GET', path: '/decks', handler: listDecks },
  { method: 'POST', path: '/decks', handler: createDeck },
  { method: 'GET', path: '/decks/{id}', handler: getDeck },
  { method: 'PUT', path: '/decks/{id}', handler: putDeck },
  { method: 'DELETE', path: '/decks/{id}', handler: deleteDeck },
]
