import { describe, it, expect } from 'vitest'
import type { Term } from '../data/terms'
import { DEADLOCK_TERMS } from '../data/deadlock'
import {
  buildTest,
  distribute,
  formatDuration,
  grade,
  questionCount,
  score,
  skippedCount,
  type Answer,
  type Question,
  type TestSettings,
} from '../utils/testBuilder'

const makeTerms = (n: number): Term[] =>
  Array.from({ length: n }, (_, i) => ({ id: i + 1, category: i % 2 ? 'Odd' : 'Even', term: `Term ${i + 1}`, definition: `Definition ${i + 1}` }))

function seeded(seed = 1) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const all: TestSettings = { count: 20, answerWith: 'term', types: ['trueFalse', 'choice', 'matching', 'written'] }
const termsOf = (q: Question) => (q.type === 'matching' ? q.terms : [q.term])

/** The right answer for every question. */
function perfect(questions: Question[]): Record<number, Answer> {
  return Object.fromEntries(questions.map((q, i): [number, Answer] => {
    if (q.type === 'trueFalse') return [i, q.isTrue]
    if (q.type === 'choice') return [i, q.term.id]
    if (q.type === 'written') return [i, q.term.term]
    return [i, Object.fromEntries(q.terms.map(t => [t.id, t.id]))]
  }))
}

describe('distribute', () => {
  it('shares questions evenly, earlier types first', () => {
    expect(distribute(20, all.types)).toEqual({ trueFalse: 5, choice: 5, matching: 5, written: 5 })
    expect(distribute(10, all.types)).toEqual({ trueFalse: 3, choice: 3, matching: 2, written: 2 })
    expect(distribute(7, ['choice', 'written'])).toEqual({ trueFalse: 0, choice: 4, matching: 0, written: 3 })
  })

  it('never leaves matching with a single term', () => {
    for (let count = 1; count <= 12; count++) {
      const share = distribute(count, all.types)
      expect(share.matching, `count ${count}`).not.toBe(1)
      expect(share.trueFalse + share.choice + share.matching + share.written).toBe(count)
    }
    expect(distribute(1, ['matching', 'written'])).toMatchObject({ matching: 0, written: 1 })
  })

  it('gives nothing when no type is selected', () => {
    expect(distribute(10, [])).toEqual({ trueFalse: 0, choice: 0, matching: 0, written: 0 })
  })
})

describe('buildTest', () => {
  const terms = makeTerms(30)

  it('contains each selected type, grouped in order, with no term used twice', () => {
    const questions = buildTest(terms, terms, all, seeded())
    const types = questions.map(q => q.type)
    expect([...new Set(types)]).toEqual(['trueFalse', 'choice', 'matching', 'written'])
    expect(types).toEqual([...types].sort((a, b) => ['trueFalse', 'choice', 'matching', 'written'].indexOf(a) - ['trueFalse', 'choice', 'matching', 'written'].indexOf(b)))
    const used = questions.flatMap(termsOf).map(t => t.id)
    expect(used).toHaveLength(20)
    expect(new Set(used).size).toBe(20)
    expect(questionCount(questions)).toBe(20)
  })

  it('never asks for more questions than there are terms', () => {
    const questions = buildTest(makeTerms(6), makeTerms(6), { ...all, count: 50 }, seeded())
    expect(questionCount(questions)).toBe(6)
  })

  it('only uses the selected types', () => {
    const questions = buildTest(terms, terms, { ...all, types: ['written'] }, seeded())
    expect(questions.every(q => q.type === 'written')).toBe(true)
    expect(buildTest(terms, terms, { ...all, types: [] }, seeded())).toEqual([])
  })

  it('makes true/false statements true about half the time', () => {
    const questions = buildTest(terms, terms, { count: 20, answerWith: 'term', types: ['trueFalse'] }, seeded(5))
    expect(questions.filter(q => q.type === 'trueFalse' && q.isTrue)).toHaveLength(10)
  })

  it('never makes a false statement out of a term and its own answer', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const questions = buildTest(terms, terms, { count: 20, answerWith: 'term', types: ['trueFalse'] }, seeded(seed))
      for (const q of questions) {
        if (q.type !== 'trueFalse') continue
        if (q.isTrue) expect(q.shown.id).toBe(q.term.id)
        else expect(q.shown.term).not.toBe(q.term.term)
      }
    }
  })

  it('never makes a false statement that is actually true when cards share answers', () => {
    // Deadlock item categories: 155 cards, three answers.
    const cards = DEADLOCK_TERMS.filter(t => t.category === 'Item category')
    const questions = buildTest(cards, DEADLOCK_TERMS, { count: 40, answerWith: 'term', types: ['trueFalse'] }, seeded(3))
    for (const q of questions) if (q.type === 'trueFalse' && !q.isTrue) expect(q.shown.term).not.toBe(q.term.term)
  })

  it('gives multiple choice the right answer among distinct options', () => {
    const questions = buildTest(terms, terms, { count: 10, answerWith: 'term', types: ['choice'] }, seeded())
    for (const q of questions) {
      if (q.type !== 'choice') continue
      expect(q.options).toHaveLength(4)
      expect(q.options.map(o => o.id)).toContain(q.term.id)
      expect(new Set(q.options.map(o => o.term)).size).toBe(4)
    }
  })

  it('splits matching into groups of at most five, never a group of one', () => {
    const questions = buildTest(terms, terms, { count: 11, answerWith: 'term', types: ['matching'] }, seeded())
    const sizes = questions.map(q => (q.type === 'matching' ? q.terms.length : 0))
    expect(sizes.reduce((a, b) => a + b, 0)).toBe(11)
    expect(sizes.every(n => n >= 2 && n <= 5)).toBe(true)
    for (const q of questions) if (q.type === 'matching') expect(q.choices.map(c => c.id).sort()).toEqual(q.terms.map(t => t.id).sort())
  })
})

describe('grade', () => {
  const terms = makeTerms(30)
  const questions = buildTest(terms, terms, all, seeded(2))

  it('gives full marks for the right answers', () => {
    const items = grade(questions, perfect(questions), all)
    expect(items).toHaveLength(20)
    expect(items.map(i => i.number)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1))
    expect(score(items)).toEqual({ correct: 20, incorrect: 0, percent: 100 })
  })

  it('marks skipped questions wrong and counts them', () => {
    const items = grade(questions, {}, all)
    expect(score(items)).toEqual({ correct: 0, incorrect: 20, percent: 0 })
    expect(items.every(i => i.given === null)).toBe(true)
    expect(skippedCount(questions, {}, all)).toBe(20)
    expect(skippedCount(questions, perfect(questions), all)).toBe(0)
  })

  it('shows the user\'s answer and the right one for a wrong answer', () => {
    const index = questions.findIndex(q => q.type === 'choice')
    const q = questions[index] as Extract<Question, { type: 'choice' }>
    const wrong = q.options.find(o => o.id !== q.term.id)!
    const item = grade(questions, { [index]: wrong.id }, all).find(i => i.questionIndex === index)!
    expect(item).toMatchObject({ correct: false, given: wrong.term, expected: q.term.term, prompt: q.term.definition })
  })

  it('grades true/false both ways', () => {
    const index = questions.findIndex(q => q.type === 'trueFalse')
    const q = questions[index] as Extract<Question, { type: 'trueFalse' }>
    const right = grade(questions, { [index]: q.isTrue }, all).find(i => i.questionIndex === index)!
    const wrong = grade(questions, { [index]: !q.isTrue }, all).find(i => i.questionIndex === index)!
    expect(right.correct).toBe(true)
    expect(wrong.correct).toBe(false)
  })

  it('grades written answers ignoring case and punctuation', () => {
    const index = questions.findIndex(q => q.type === 'written')
    const q = questions[index] as Extract<Question, { type: 'written' }>
    const item = (text: string) => grade(questions, { [index]: text }, all).find(i => i.questionIndex === index)!
    expect(item(q.term.term.toUpperCase() + '!').correct).toBe(true)
    expect(item('nonsense').correct).toBe(false)
    expect(item('   ')).toMatchObject({ correct: false, given: null })
  })

  it('grades each matching pair separately', () => {
    const index = questions.findIndex(q => q.type === 'matching')
    const q = questions[index] as Extract<Question, { type: 'matching' }>
    const [a, b] = q.terms
    const picks = { ...Object.fromEntries(q.terms.map(t => [t.id, t.id])), [a.id]: b.id, [b.id]: a.id }
    const items = grade(questions, { [index]: picks }, all).filter(i => i.questionIndex === index)
    expect(items.filter(i => !i.correct).map(i => i.term.id).sort()).toEqual([a.id, b.id].sort())
    expect(items.filter(i => i.correct)).toHaveLength(q.terms.length - 2)
  })

  it('accepts either card when two cards share an answer', () => {
    const cards = DEADLOCK_TERMS.filter(t => t.category === 'Item category').slice(0, 12)
    const settings: TestSettings = { count: 4, answerWith: 'term', types: ['matching'] }
    const [q] = buildTest(cards, DEADLOCK_TERMS, settings, seeded()) as Extract<Question, { type: 'matching' }>[]
    // Pick, for each term, any choice with the same answer text rather than the term itself.
    const picks = Object.fromEntries(q.terms.map(t => [t.id, q.choices.find(c => c.term === t.term)!.id]))
    expect(grade([q], { 0: picks }, settings).every(i => i.correct)).toBe(true)
  })

  it('can ask for the definition instead of the term', () => {
    const settings: TestSettings = { count: 4, answerWith: 'definition', types: ['choice', 'written'] }
    const qs = buildTest(terms, terms, settings, seeded())
    const items = grade(qs, Object.fromEntries(qs.map((q, i) => [i, q.type === 'choice' ? q.term.id : (q as { term: Term }).term.definition])), settings)
    expect(items.every(i => i.correct)).toBe(true)
    expect(items[0].prompt).toMatch(/^Term /)
    expect(items[0].expected).toMatch(/^Definition /)
  })
})

describe('formatDuration', () => {
  it('formats seconds as minutes and seconds', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(600)).toBe('10:00')
  })
})
