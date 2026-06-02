import { describe, it, expect } from 'vitest'
import { encodeShareLink, decodeShareLink } from '../utils/shareLink'
import type { Deck } from '../hooks/useDecks'
import type { Term } from '../data/terms'

const TERM: Term = { id: 1, category: 'Test', term: 'Ionian', definition: 'The major scale mode — résumé safe.' }
const DECK: Deck = { id: 'abc', name: 'My Deck', terms: [TERM] }

describe('encodeShareLink', () => {
  it('returns a non-empty string', () => {
    expect(encodeShareLink(DECK)).toBeTruthy()
  })
  it('round-trips through decodeShareLink', () => {
    const encoded = encodeShareLink(DECK)
    const decoded = decodeShareLink(encoded)
    expect(decoded?.name).toBe(DECK.name)
    expect(decoded?.terms[0].term).toBe(TERM.term)
    expect(decoded?.terms[0].definition).toBe(TERM.definition)
  })
  it('handles non-ASCII characters correctly', () => {
    const deck: Deck = { id: 'x', name: 'Décks', terms: [{ id: 1, category: 'C', term: '音楽', definition: 'Music 音' }] }
    const decoded = decodeShareLink(encodeShareLink(deck))
    expect(decoded?.terms[0].term).toBe('音楽')
  })
})

describe('decodeShareLink', () => {
  it('returns null for invalid input', () => {
    expect(decodeShareLink('not-valid-json')).toBeNull()
    expect(decodeShareLink('')).toBeNull()
  })
  it('returns null for JSON missing required fields', () => {
    const bad = encodeURIComponent(JSON.stringify({ foo: 'bar' }))
    expect(decodeShareLink(bad)).toBeNull()
  })
})
