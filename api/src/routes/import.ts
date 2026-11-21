import { HttpError, json, parseBody } from '../http'
import type { Handler, Route } from '../router'
import { deckItem, requireDeckContent, requireDeckId } from './decks'

const MAX_IMPORT_DECKS = 100

/**
 * Stores a batch of decks made in the browser, keeping the IDs they already have
 * so links like /study/<deckId>/flashcards keep working.
 *
 * A deck whose ID already exists in the account is left as it is, so importing
 * the same decks again changes nothing and never creates a duplicate.
 */
const importDecks: Handler = async ({ userId, db, event, now }) => {
  const { decks } = parseBody(event)
  if (!Array.isArray(decks)) throw new HttpError(400, 'decks must be a list')
  if (decks.length > MAX_IMPORT_DECKS) throw new HttpError(400, `at most ${MAX_IMPORT_DECKS} decks can be imported at once`)

  // Check everything before writing anything, so a bad deck doesn't leave a half-finished import.
  const valid = decks.map((raw, i) => {
    const deck = (raw ?? {}) as Record<string, unknown>
    return { id: requireDeckId(deck.id), content: requireDeckContent(deck, `decks[${i}]`) }
  })
  if (new Set(valid.map(d => d.id)).size !== valid.length) throw new HttpError(400, 'decks contains the same id more than once')

  const at = now().toISOString()
  const imported: string[] = []
  const skipped: string[] = []
  for (const { id, content } of valid) {
    const created = await db.putIfAbsent(deckItem(userId, id, content, at))
    ;(created ? imported : skipped).push(id)
  }
  return json(200, { imported, skipped })
}

export const importRoutes: Route[] = [{ method: 'POST', path: '/flashcards/import', handler: importDecks }]
