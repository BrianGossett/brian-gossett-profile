import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useDecks, useDeckById, filterByCategory, getDeckCategories, DEFAULT_DECK } from '../hooks/useDecks'
import type { Term } from '../data/terms'

const TERM_A: Term = { id: 1, category: 'Scales', term: 'Major Scale', definition: 'A diatonic scale.' }
const TERM_B: Term = { id: 2, category: 'Chords', term: 'Triad', definition: 'Three-note chord.' }

beforeEach(() => localStorage.clear())

describe('useDecks', () => {
  it('starts with no custom decks', () => {
    const { result } = renderHook(() => useDecks())
    expect(result.current.customDecks).toEqual([])
  })

  it('createDeck adds a deck to localStorage', () => {
    const { result } = renderHook(() => useDecks())
    act(() => { result.current.createDeck('My Deck', [TERM_A]) })
    expect(result.current.customDecks).toHaveLength(1)
    expect(result.current.customDecks[0].name).toBe('My Deck')
    expect(JSON.parse(localStorage.getItem('study-custom-decks')!)).toHaveLength(1)
  })

  it('updateDeck mutates name and terms in place', () => {
    const { result } = renderHook(() => useDecks())
    let id = ''
    act(() => { id = result.current.createDeck('Old', [TERM_A]).id })
    act(() => { result.current.updateDeck(id, 'New', [TERM_A, TERM_B]) })
    expect(result.current.customDecks[0].name).toBe('New')
    expect(result.current.customDecks[0].terms).toHaveLength(2)
  })

  it('deleteDeck removes the deck', () => {
    const { result } = renderHook(() => useDecks())
    let id = ''
    act(() => { id = result.current.createDeck('Gone', [TERM_A]).id })
    act(() => { result.current.deleteDeck(id) })
    expect(result.current.customDecks).toHaveLength(0)
  })
})

describe('useDeckById', () => {
  it('returns DEFAULT_DECK for id "default"', () => {
    const { result } = renderHook(() => useDeckById('default'))
    expect(result.current.id).toBe('default')
    expect(result.current.terms.length).toBeGreaterThan(0)
  })

  it('returns DEFAULT_DECK for unknown id', () => {
    const { result } = renderHook(() => useDeckById('no-such-id'))
    expect(result.current.id).toBe('default')
  })

  it('returns matching custom deck', () => {
    localStorage.setItem('study-custom-decks', JSON.stringify([
      { id: 'abc', name: 'Spanish', terms: [TERM_A] }
    ]))
    const { result } = renderHook(() => useDeckById('abc'))
    expect(result.current.name).toBe('Spanish')
  })
})

describe('filterByCategory', () => {
  const terms = [TERM_A, TERM_B]
  it('"all" returns all terms', () => expect(filterByCategory(terms, 'all')).toHaveLength(2))
  it('filters by category', () => expect(filterByCategory(terms, 'Scales')).toEqual([TERM_A]))
  it('returns empty array for unknown category', () => expect(filterByCategory(terms, 'Nope')).toHaveLength(0))
})

describe('getDeckCategories', () => {
  it('returns unique sorted categories', () => {
    expect(getDeckCategories([TERM_A, TERM_B])).toEqual(['Chords', 'Scales'])
  })
})

describe('DEFAULT_DECK', () => {
  it('has id "default"', () => expect(DEFAULT_DECK.id).toBe('default'))
  it('has terms from ALL_TERMS', () => expect(DEFAULT_DECK.terms.length).toBeGreaterThan(0))
})
