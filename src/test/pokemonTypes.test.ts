import { describe, it, expect } from 'vitest'
import { POKEMON_TYPE_TERMS, TYPES, TYPE_CHART, effectiveness } from '../data/pokemonTypes'
import { BUILT_IN_DECKS, POKEMON_TYPES_DECK, findBuiltInDeck, isBuiltInDeck } from '../hooks/useDecks'
import { isMatch, listItems } from '../utils/studyQuestions'
import type { Term } from '../data/terms'

const card = (prompt: string) => POKEMON_TYPE_TERMS.find(t => t.definition === prompt)

describe('type chart', () => {
  it('has all 18 types, each with a row', () => {
    expect(TYPES).toHaveLength(18)
    expect(Object.keys(TYPE_CHART).sort()).toEqual([...TYPES].sort())
  })

  it('only names real types, and never lists one twice for an attacker', () => {
    for (const type of TYPES) {
      const all = [...TYPE_CHART[type].s, ...TYPE_CHART[type].n, ...TYPE_CHART[type].i]
      expect(all.every(t => TYPES.includes(t))).toBe(true)
      expect(new Set(all).size).toBe(all.length)
    }
  })

  it('gives the right multipliers for well-known matchups', () => {
    expect(effectiveness('Water', 'Fire')).toBe(2)
    expect(effectiveness('Fire', 'Water')).toBe(0.5)
    expect(effectiveness('Normal', 'Ghost')).toBe(0)
    expect(effectiveness('Ground', 'Flying')).toBe(0)
    expect(effectiveness('Electric', 'Ground')).toBe(0)
    expect(effectiveness('Dragon', 'Fairy')).toBe(0)
    expect(effectiveness('Fairy', 'Dragon')).toBe(2)
    expect(effectiveness('Normal', 'Normal')).toBe(1)
  })
})

describe('type matchup cards', () => {
  it('spot checks: Fire, Ghost, Steel and Fairy', () => {
    expect(card('What is Fire super effective against?')?.term).toBe('Grass, Ice, Bug, Steel')
    expect(card('What is Fire weak to?')?.term).toBe('Water, Ground, Rock')
    expect(card('What is Ghost immune to?')?.term).toBe('Normal, Fighting')
    expect(card('What is Ghost weak to?')?.term).toBe('Ghost, Dark')
    expect(card('What is Steel immune to?')?.term).toBe('Poison')
    expect(card('What does Steel resist?')?.term).toBe('Normal, Grass, Ice, Flying, Psychic, Bug, Rock, Dragon, Steel, Fairy')
    expect(card('What is Fairy weak to?')?.term).toBe('Poison, Steel')
    expect(card('What is Fairy immune to?')?.term).toBe('Dragon')
    expect(card('Which types resist Fairy attacks?')?.term).toBe('Fire, Poison, Steel')
  })

  it('leaves out questions with no answer', () => {
    expect(card('What is Normal super effective against?')).toBeUndefined()
    expect(card('What is Fire immune to?')).toBeUndefined()
    expect(POKEMON_TYPE_TERMS.every(t => t.term.trim() !== '' && t.definition.trim() !== '')).toBe(true)
  })

  it('has unique, fixed IDs', () => {
    const ids = POKEMON_TYPE_TERMS.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(card('What is Fire super effective against?')?.id).toBe(21) // Fire is type 2, question 1
    expect(card('What is Fairy immune to?')?.id).toBe(185)
  })

  it('agrees with the chart in both directions', () => {
    for (const type of TYPES) {
      const weak = card(`What is ${type} weak to?`)?.term.split(', ') ?? []
      expect(weak).toEqual(TYPES.filter(attacker => TYPE_CHART[attacker].s.includes(type)))
    }
  })

  it('groups cards into the five question kinds', () => {
    expect([...new Set(POKEMON_TYPE_TERMS.map(t => t.category))].sort()).toEqual(
      ['Immune to', 'Resisted by', 'Resists', 'Super effective against', 'Weak to'],
    )
    expect(POKEMON_TYPE_TERMS.filter(t => t.category === 'Weak to')).toHaveLength(18)
  })
})

describe('built-in decks', () => {
  it('include Music Theory, the type matchups and Deadlock', () => {
    expect(BUILT_IN_DECKS.map(d => d.id)).toEqual(['default', 'pokemon-types', 'deadlock'])
    expect(findBuiltInDeck('pokemon-types')?.terms).toBe(POKEMON_TYPES_DECK.terms)
    expect(isBuiltInDeck('default')).toBe(true)
    expect(isBuiltInDeck('3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8091a2')).toBe(false)
  })
})

describe('typed answers that are lists', () => {
  const fire: Term = { id: 21, category: 'c', term: 'Grass, Ice, Bug, Steel', definition: 'd' }
  const single: Term = { id: 1, category: 'c', term: 'Poison', definition: 'd' }

  it('recognises a list answer', () => {
    expect(listItems('Grass, Ice, Bug, Steel')).toEqual(['grass', 'ice', 'bug', 'steel'])
    expect(listItems('Mezzo Piano')).toBeNull()
    expect(listItems('Poison')).toBeNull()
  })

  it.each([
    'Grass, Ice, Bug, Steel',
    'steel, bug, ice, grass',
    'grass ice bug steel',
    'Grass,Ice,Bug,Steel',
    'grass, ice, bug and steel',
    'Gras, Ice, Bug, Stel', // one-letter typos in longer names
  ])('accepts %j', input => expect(isMatch(input, fire)).toBe(true))

  it.each([
    ['Grass, Ice, Bug', 'one missing'],
    ['Grass, Ice, Bug, Steel, Water', 'one extra'],
    ['Grass, Ice, Bug, Rock', 'one wrong'],
    ['Grass, Grass, Ice, Bug, Steel', 'one given twice'],
    ['Grass', 'only the first item'],
    ['', 'nothing'],
    ['Grass, Ice, Bog, Steel', 'a typo in a three-letter name'],
  ])('rejects %j (%s)', input => expect(isMatch(input, fire)).toBe(false))

  it('does not let the first word of a list pass by itself', () => {
    // Without list checking, "grass" would match on the first-word rule.
    expect(isMatch('grass', fire)).toBe(false)
  })

  it('checks single answers exactly as before', () => {
    expect(isMatch('poison', single)).toBe(true)
    expect(isMatch('Poison!', single)).toBe(true)
    expect(isMatch('poison, steel', single)).toBe(true) // the long-standing first-word rule still applies
    expect(isMatch('steel', single)).toBe(false)
  })

  it('keeps multi-word items together when a list has them', () => {
    const term: Term = { id: 1, category: 'c', term: 'Whole Step, Half Step', definition: 'd' }
    expect(isMatch('half step, whole step', term)).toBe(true)
    expect(isMatch('half, step, whole, step', term)).toBe(false)
  })
})
