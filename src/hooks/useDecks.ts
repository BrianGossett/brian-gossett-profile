import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { ALL_TERMS, type Term } from '../data/terms'
import { readDecks, subscribeDecks, writeDecks, type Deck } from './deckStore'
import { deckSync, type SyncStatus } from './deckSync'
import { removeProgress } from './progressStore'
import { progressSync } from './progressSync'

export type { Deck }

export const DEFAULT_DECK: Deck = {
  id: 'default',
  name: 'Music Theory',
  terms: ALL_TERMS,
}

export function filterByCategory(terms: Term[], category: string): Term[] {
  if (category === 'all') return terms
  return terms.filter(t => t.category === category)
}

export function getDeckCategories(terms: Term[]): string[] {
  return [...new Set(terms.map(t => t.category))].sort()
}

export function useDecks() {
  const customDecks = useSyncExternalStore(subscribeDecks, readDecks)

  // Each change is written to this browser first, so these stay synchronous,
  // and then sent to the account in the background when someone is signed in.
  const createDeck = useCallback((name: string, terms: Term[]): Deck => {
    const deck: Deck = { id: crypto.randomUUID(), name, terms }
    writeDecks([...readDecks(), deck])
    deckSync.put(deck)
    return deck
  }, [])

  const updateDeck = useCallback((id: string, name: string, terms: Term[]): void => {
    const next = readDecks().map(d => d.id === id ? { ...d, name, terms } : d)
    writeDecks(next)
    const updated = next.find(d => d.id === id)
    if (updated) deckSync.put(updated)
  }, [])

  const deleteDeck = useCallback((id: string): void => {
    writeDecks(readDecks().filter(d => d.id !== id))
    deckSync.remove(id)
    // The deck's progress goes with it (the API deletes its copy along with the deck).
    removeProgress(id)
    progressSync.forget(id)
  }, [])

  return { customDecks, createDeck, updateDeck, deleteDeck }
}

export function useDeckById(deckId: string): Deck {
  const decks = useSyncExternalStore(subscribeDecks, readDecks)
  return useMemo(
    () => (deckId === 'default' ? DEFAULT_DECK : decks.find(d => d.id === deckId) ?? DEFAULT_DECK),
    [deckId, decks],
  )
}

/** Where loading the signed-in user's decks from their account has got to. */
export function useDeckSyncStatus(): SyncStatus {
  return useSyncExternalStore(deckSync.subscribe, deckSync.getStatus)
}
