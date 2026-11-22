import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFakeDeckApi } from './fakeDeckApi'

// The hooks talk to the account through the shared API client; swap in an in-memory one.
const fake = vi.hoisted(() => ({ current: null as ReturnType<typeof import('./fakeDeckApi').createFakeDeckApi> | null }))
vi.mock('../api/client', async importOriginal => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  api: (path: string, options?: object) => fake.current!.api(path, options),
}))

import { useDecks, useDeckById, useDeckSyncStatus, filterByCategory, getDeckCategories, DEFAULT_DECK } from '../hooks/useDecks'
import { deckSync } from '../hooks/deckSync'
import type { Term } from '../data/terms'

const TERM_A: Term = { id: 1, category: 'Scales', term: 'Major Scale', definition: 'A diatonic scale.' }
const TERM_B: Term = { id: 2, category: 'Chords', term: 'Triad', definition: 'Three-note chord.' }

beforeEach(() => {
  deckSync.signedOut()
  localStorage.clear()
  fake.current = createFakeDeckApi()
})

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

describe('useDecks when signed out', () => {
  it('never calls the API', () => {
    const { result } = renderHook(() => useDecks())
    let id = ''
    act(() => { id = result.current.createDeck('Local only', [TERM_A]).id })
    act(() => { result.current.updateDeck(id, 'Renamed', [TERM_A]) })
    act(() => { result.current.deleteDeck(id) })
    expect(fake.current!.calls).toEqual([])
  })
})

describe('useDecks when signed in', () => {
  const server = () => fake.current!.server
  const signIn = () => act(async () => { await deckSync.signedIn('user-1') })

  it('loads decks from the account', async () => {
    server().set('remote', { id: 'remote', name: 'From my account', terms: [TERM_A] })
    const { result } = renderHook(() => useDecks())
    expect(result.current.customDecks).toEqual([])
    await signIn()
    expect(result.current.customDecks).toEqual([{ id: 'remote', name: 'From my account', terms: [TERM_A] }])
    expect(JSON.parse(localStorage.getItem('study-custom-decks')!)).toHaveLength(1)
  })

  it('createDeck still returns the deck straight away, then saves it to the account', async () => {
    const { result } = renderHook(() => useDecks())
    await signIn()
    let created = { id: '' }
    act(() => { created = result.current.createDeck('New', [TERM_A]) })
    expect(created.id).not.toBe('')
    expect(result.current.customDecks.map(d => d.id)).toEqual([created.id])
    expect(JSON.parse(localStorage.getItem('study-custom-decks')!)[0].id).toBe(created.id)
    await waitFor(() => expect(server().get(created.id)).toEqual({ id: created.id, name: 'New', terms: [TERM_A] }))
  })

  it('updateDeck saves the change to the account', async () => {
    const { result } = renderHook(() => useDecks())
    await signIn()
    let id = ''
    act(() => { id = result.current.createDeck('Old', [TERM_A]).id })
    act(() => { result.current.updateDeck(id, 'New', [TERM_A, TERM_B]) })
    await waitFor(() => expect(server().get(id)).toMatchObject({ name: 'New', terms: [TERM_A, TERM_B] }))
  })

  it('deleteDeck removes it from the account', async () => {
    server().set('remote', { id: 'remote', name: 'x', terms: [] })
    const { result } = renderHook(() => useDecks())
    await signIn()
    act(() => { result.current.deleteDeck('remote') })
    expect(result.current.customDecks).toEqual([])
    await waitFor(() => expect(server().has('remote')).toBe(false))
  })

  it('still shows cached decks, and does not throw, when the API is down', async () => {
    localStorage.setItem('study-custom-decks', JSON.stringify([{ id: 'cached', name: 'Cached', terms: [TERM_A] }]))
    localStorage.setItem('study-decks-owner', 'user-1')
    fake.current!.failWith('network')
    const { result } = renderHook(() => ({ decks: useDecks(), status: useDeckSyncStatus() }))
    await signIn()
    expect(result.current.status).toBe('error')
    expect(result.current.decks.customDecks.map(d => d.id)).toEqual(['cached'])

    // Changes still work locally while offline.
    act(() => { result.current.decks.createDeck('Made offline', [TERM_A]) })
    expect(result.current.decks.customDecks).toHaveLength(2)
  })

  it('useDeckById picks up a deck once it has loaded from the account', async () => {
    server().set('remote', { id: 'remote', name: 'Spanish', terms: [TERM_A] })
    const { result } = renderHook(() => useDeckById('remote'))
    expect(result.current.id).toBe('default')
    await signIn()
    expect(result.current.name).toBe('Spanish')
  })

  it('reports loading, then ready', async () => {
    const { result } = renderHook(() => useDeckSyncStatus())
    expect(result.current).toBe('idle')
    let loading: Promise<void> = Promise.resolve()
    act(() => { loading = deckSync.signedIn('user-1') })
    expect(result.current).toBe('loading')
    await act(async () => { await loading })
    expect(result.current).toBe('ready')
  })
})
