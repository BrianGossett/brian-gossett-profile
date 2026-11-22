import { describe, it, expect } from 'vitest'
import { COUNTERS, DEADLOCK_TERMS, FACTS, HEROES, ITEMS } from '../data/deadlock'
import { DEADLOCK_DECK, isBuiltInDeck } from '../hooks/useDecks'
import { createRound } from '../utils/learn'
import { answerKey, getDistractors, isMatch } from '../utils/studyQuestions'

const inCategory = (category: string) => DEADLOCK_TERMS.filter(t => t.category === category)
const card = (definition: string) => DEADLOCK_TERMS.find(t => t.definition === definition)
const itemNames = new Set(ITEMS.map(i => i.name))

describe('Deadlock data', () => {
  it('has the items, heroes, counters and facts from the trainer', () => {
    expect(ITEMS).toHaveLength(155)
    expect(HEROES).toHaveLength(42)
    expect(COUNTERS).toHaveLength(12)
    expect(FACTS).toHaveLength(28)
  })

  it('prices every item by tier', () => {
    expect([...new Set(ITEMS.map(i => i.cost))].sort((a, b) => a - b)).toEqual([800, 1600, 3200, 6400])
    expect(ITEMS.every(i => ['Weapon', 'Vitality', 'Spirit'].includes(i.cat))).toBe(true)
  })

  it('only refers to items that exist, and upgrade paths agree in both directions', () => {
    for (const item of ITEMS) {
      for (const name of [...item.into, ...item.from]) expect(itemNames.has(name), `${item.name} → ${name}`).toBe(true)
      for (const name of item.into) expect(ITEMS.find(i => i.name === name)!.from, name).toContain(item.name)
    }
    for (const counter of COUNTERS) for (const name of counter.items) expect(itemNames.has(name), name).toBe(true)
  })

  it('gives every hero four abilities, none shared with another hero', () => {
    const abilities = HEROES.flatMap(h => h.kit)
    expect(HEROES.every(h => h.kit.length === 4)).toBe(true)
    expect(new Set(abilities).size).toBe(168)
  })
})

describe('Deadlock cards', () => {
  it('has the expected number of cards in each category', () => {
    expect(inCategory('Item category')).toHaveLength(155)
    expect(inCategory('Item cost')).toHaveLength(155)
    expect(inCategory('Whose ability')).toHaveLength(168)
    expect(inCategory('Ultimates')).toHaveLength(42)
    expect(inCategory('Full kits')).toHaveLength(42)
    expect(inCategory('Upgrades')).toHaveLength(105)
    expect(inCategory('Counters')).toHaveLength(12)
    expect(inCategory('Basics')).toHaveLength(28)
    expect(DEADLOCK_TERMS).toHaveLength(707)
  })

  it('has unique IDs and no empty question or answer', () => {
    expect(new Set(DEADLOCK_TERMS.map(t => t.id)).size).toBe(DEADLOCK_TERMS.length)
    expect(DEADLOCK_TERMS.every(t => t.term.trim() !== '' && t.definition.trim() !== '')).toBe(true)
  })

  it('spot checks against the trainer', () => {
    expect(card('Which shop category is Toxic Bullets in?')?.term).toBe('Weapon')
    expect(card('How many souls does Toxic Bullets cost?')?.term).toBe('3200')
    expect(card('Whose ability is Siphon Life?')?.term).toBe('Abrams')
    expect(card("What is Haze's ultimate?")?.term).toBe('Bullet Dance')
    expect(card("Name all four of Haze's abilities.")?.term).toBe('Sleep Dagger, Smoke Bomb, Fixation, Bullet Dance')
    expect(card('What does Extra Charge upgrade into?')?.term).toBe('Rapid Recharge')
    expect(card('Name every item Extra Spirit upgrades into.')?.term).toBe('Improved Spirit, Surge of Power')
    expect(card('What does Rapid Recharge build from?')?.term).toBe('Extra Charge')
    expect(card('Which items counter this: constant slows on you?')?.term).toBe('Enduring Speed, Fleetfoot, Juggernaut, Magic Carpet')
    expect(card('What does a Tier 2 item cost?')?.term).toBe('1600 souls')
    expect(card('What are the three item categories in the shop?')?.term).toBe('Weapon, Vitality and Spirit')
  })

  it('is a built-in deck', () => {
    expect(isBuiltInDeck('deadlock')).toBe(true)
    expect(DEADLOCK_DECK.terms).toBe(DEADLOCK_TERMS)
  })
})

describe('cards that share an answer', () => {
  it('never offers the same answer twice in multiple choice', () => {
    const category = inCategory('Item category')
    for (const correct of category.slice(0, 40)) {
      const options = [correct, ...getDistractors(correct, DEADLOCK_TERMS)]
      const answers = options.map(answerKey)
      expect(new Set(answers).size, correct.definition).toBe(answers.length)
    }
  })

  it('offers three options rather than padding a category that only has three answers', () => {
    const correct = inCategory('Item category')[0]
    const distractors = getDistractors(correct, DEADLOCK_TERMS)
    expect(distractors).toHaveLength(2)
    expect(distractors.every(d => d.category === 'Item category')).toBe(true)
  })

  it('still offers four options when the category has four answers', () => {
    const distractors = getDistractors(inCategory('Item cost')[0], DEADLOCK_TERMS)
    expect(distractors).toHaveLength(3)
    expect(distractors.every(d => d.category === 'Item cost')).toBe(true)
  })

  it('builds Learn questions with distinct options', () => {
    const terms = inCategory('Item cost')
    const round = createRound(terms, {}, DEADLOCK_TERMS)!
    for (const q of round.queue) {
      const answers = q.options.map(answerKey)
      expect(new Set(answers).size).toBe(answers.length)
      expect(answers).toContain(answerKey(q.term))
    }
  })
})

describe('typed answers for Deadlock cards', () => {
  it('accepts a cost typed as a plain number', () => {
    const cost = card('How many souls does Toxic Bullets cost?')!
    expect(isMatch('3200', cost)).toBe(true)
    expect(isMatch('3,200', cost)).toBe(true)
    expect(isMatch('1600', cost)).toBe(false)
  })

  it('accepts a full kit in any order, including a name that contains a comma', () => {
    const hero = HEROES.find(h => h.kit.some(a => a.includes(',')))!
    const kit = card(`Name all four of ${hero.name}'s abilities.`)!
    expect(isMatch([...hero.kit].reverse().join(', '), kit)).toBe(true)
    expect(isMatch(hero.kit.slice(0, 3).join(', '), kit)).toBe(false)
  })

  it('accepts a kit containing an ability with "and" in its name', () => {
    const hero = HEROES.find(h => h.kit.some(a => / and /i.test(a)))!
    const kit = card(`Name all four of ${hero.name}'s abilities.`)!
    expect(isMatch(hero.kit.join(', '), kit)).toBe(true)
    expect(isMatch([...hero.kit].reverse().join(', '), kit)).toBe(true)
  })

  it('accepts "Weapon, Vitality and Spirit" in any order and with different separators', () => {
    const fact = card('What are the three item categories in the shop?')!
    expect(isMatch('spirit, weapon, vitality', fact)).toBe(true)
    expect(isMatch('weapon vitality spirit', fact)).toBe(true)
    expect(isMatch('weapon and spirit', fact)).toBe(false)
  })

  it('accepts a hero name with a small typo only when the name is long enough', () => {
    const who = card('Whose ability is Siphon Life?')!
    expect(isMatch('abrams', who)).toBe(true)
    expect(isMatch('haze', who)).toBe(false)
  })
})
