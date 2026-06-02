import { useState, useCallback, useMemo } from 'react'
import { ALL_TERMS, type Term } from '../data/terms'

const DECKS_KEY = 'study-custom-decks'

export interface Deck {
  id: string
  name: string
  terms: Term[]
}

export const DEFAULT_DECK: Deck = {
  id: 'default',
  name: 'Music Theory',
  terms: ALL_TERMS,
}

function loadCustomDecks(): Deck[] {
  try {
    const raw = localStorage.getItem(DECKS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCustomDecks(decks: Deck[]): void {
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks))
}

export function filterByCategory(terms: Term[], category: string): Term[] {
  if (category === 'all') return terms
  return terms.filter(t => t.category === category)
}

export function getDeckCategories(terms: Term[]): string[] {
  return [...new Set(terms.map(t => t.category))].sort()
}

export function useDecks() {
  const [customDecks, setCustomDecks] = useState<Deck[]>(loadCustomDecks)

  const createDeck = useCallback((name: string, terms: Term[]): Deck => {
    const deck: Deck = { id: crypto.randomUUID(), name, terms }
    setCustomDecks(prev => {
      const next = [...prev, deck]
      saveCustomDecks(next)
      return next
    })
    return deck
  }, [])

  const updateDeck = useCallback((id: string, name: string, terms: Term[]): void => {
    setCustomDecks(prev => {
      const next = prev.map(d => d.id === id ? { ...d, name, terms } : d)
      saveCustomDecks(next)
      return next
    })
  }, [])

  const deleteDeck = useCallback((id: string): void => {
    setCustomDecks(prev => {
      const next = prev.filter(d => d.id !== id)
      saveCustomDecks(next)
      return next
    })
  }, [])

  return { customDecks, createDeck, updateDeck, deleteDeck }
}

export function useDeckById(deckId: string): Deck {
  return useMemo(() => {
    if (deckId === 'default') return DEFAULT_DECK
    try {
      const raw = localStorage.getItem(DECKS_KEY)
      const decks: Deck[] = raw ? JSON.parse(raw) : []
      return decks.find(d => d.id === deckId) ?? DEFAULT_DECK
    } catch {
      return DEFAULT_DECK
    }
  }, [deckId])
}
