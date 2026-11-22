import type { Term } from '../data/terms'

export interface Deck {
  id: string
  name: string
  terms: Term[]
  /**
   * Which side flashcards show first. Most decks are a term and its definition
   * (term first); question-and-answer decks put the question in `definition`
   * and show that first.
   */
  front?: 'term' | 'definition'
}

/**
 * Custom decks in this browser. For signed-out visitors this is the only copy;
 * for signed-in users it is the working copy and offline cache of their account.
 */
export const DECKS_KEY = 'study-custom-decks'

const EMPTY: Deck[] = []
const listeners = new Set<() => void>()
// Parsed decks are cached against the raw string so readers get the same array until it changes.
let cached: { raw: string | null; decks: Deck[] } = { raw: null, decks: EMPTY }

export function readDecks(): Deck[] {
  let raw: string | null
  try {
    raw = localStorage.getItem(DECKS_KEY)
  } catch {
    return EMPTY
  }
  if (raw === cached.raw) return cached.decks
  let decks = EMPTY
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : EMPTY
    if (Array.isArray(parsed)) decks = parsed as Deck[]
  } catch {
    decks = EMPTY
  }
  cached = { raw, decks }
  return decks
}

export function writeDecks(decks: Deck[]): void {
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks))
  listeners.forEach(l => l())
}

/** Calls `listener` when the decks change, in this tab or another. Returns an unsubscribe function. */
export function subscribeDecks(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => { if (e.key === DECKS_KEY || e.key === null) listener() }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}
