import { describe, it, expect } from 'vitest'
import type { Term } from '../data/terms'
import { ROUND_SIZE, answer, createRound, currentQuestion, isComplete, isLearned, isRoundOver, kindFor, learnProgress, type Round, type Stages } from '../utils/learn'
import { getDistractors, isMatch, shuffle } from '../utils/studyQuestions'

const makeTerms = (n: number, category = 'General'): Term[] =>
  Array.from({ length: n }, (_, i) => ({ id: i + 1, category, term: `Term ${i + 1}`, definition: `Definition ${i + 1}` }))

/** A repeatable random source, so shuffles are the same every run. */
function seeded(seed = 1) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/** Plays a round to the end, answering correctly unless the term is in `wrongOnce` (wrong the first time only). */
function play(round: Round, stages: Stages, pool: Term[], wrongOnce: number[] = []) {
  const missed = new Set<number>()
  const asked: { id: number; kind: string; retry: boolean }[] = []
  let state = { round, stages }
  while (!isRoundOver(state.round)) {
    const q = currentQuestion(state.round)!
    asked.push({ id: q.term.id, kind: q.kind, retry: q.retry })
    const correct = !(wrongOnce.includes(q.term.id) && !missed.has(q.term.id))
    if (!correct) missed.add(q.term.id)
    state = answer(state.round, state.stages, correct, pool, seeded(7))
  }
  return { ...state, asked }
}

describe('shared question helpers', () => {
  it('shuffles without losing or repeating anything', () => {
    expect(shuffle([1, 2, 3, 4, 5], seeded()).sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('prefers wrong options from the same category', () => {
    const pool = [...makeTerms(5, 'Scales'), ...makeTerms(5, 'Form').map(t => ({ ...t, id: t.id + 100 }))]
    const distractors = getDistractors(pool[0], pool, 3, seeded())
    expect(distractors).toHaveLength(3)
    expect(distractors.every(t => t.category === 'Scales' && t.id !== pool[0].id)).toBe(true)
  })

  it('falls back to other categories, and never includes the correct term', () => {
    const pool = [...makeTerms(2, 'Scales'), ...makeTerms(5, 'Form').map(t => ({ ...t, id: t.id + 100 }))]
    const distractors = getDistractors(pool[0], pool, 3, seeded())
    expect(distractors).toHaveLength(3)
    expect(distractors[0].category).toBe('Scales')
    expect(distractors.map(t => t.id)).not.toContain(pool[0].id)
  })

  it('accepts a typed answer regardless of case and punctuation', () => {
    const term: Term = { id: 1, category: 'c', term: 'Mezzo-Piano', definition: 'd' }
    expect(isMatch('mezzo piano', term)).toBe(true)
    expect(isMatch('MEZZOPIANO!', term)).toBe(true)
    expect(isMatch('forte', term)).toBe(false)
  })
})

describe('Learn rounds', () => {
  it('covers at most 7 terms, the first ones not yet learned', () => {
    const terms = makeTerms(20)
    const round = createRound(terms, {}, terms, seeded())!
    expect(ROUND_SIZE).toBe(7)
    expect(round.terms.map(t => t.id)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(round.queue).toHaveLength(7)
    expect(new Set(round.queue.map(q => q.term.id)).size).toBe(7)
  })

  it('asks multiple choice first, with the correct term among four options', () => {
    const terms = makeTerms(20)
    const round = createRound(terms, {}, terms, seeded())!
    for (const q of round.queue) {
      expect(q.kind).toBe('choice')
      expect(q.retry).toBe(false)
      expect(q.options).toHaveLength(4)
      expect(q.options.map(o => o.id)).toContain(q.term.id)
      expect(new Set(q.options.map(o => o.id)).size).toBe(4)
    }
  })

  it('asks for a typed answer once a term has one correct answer', () => {
    expect(kindFor(0)).toBe('choice')
    expect(kindFor(1)).toBe('typed')
    const terms = makeTerms(3)
    const round = createRound(terms, { 1: 1, 2: 1, 3: 1 }, terms, seeded())!
    expect(round.queue.every(q => q.kind === 'typed' && q.options.length === 0)).toBe(true)
  })

  it('skips learned terms and returns null when everything is learned', () => {
    const terms = makeTerms(3)
    expect(createRound(terms, { 1: 2 }, terms, seeded())!.terms.map(t => t.id)).toEqual([2, 3])
    expect(createRound(terms, { 1: 2, 2: 2, 3: 2 }, terms, seeded())).toBeNull()
    expect(createRound([], {}, [], seeded())).toBeNull()
  })

  it('moves a term one step forward on a correct answer', () => {
    const terms = makeTerms(2)
    const round = createRound(terms, {}, terms, seeded())!
    const first = currentQuestion(round)!.term.id
    const next = answer(round, {}, true, terms, seeded())
    expect(next.stages).toEqual({ [first]: 1 })
    expect(next.round.index).toBe(1)
    expect(next.round.queue).toHaveLength(2)
  })

  it('asks a missed term again before the round ends, and does not move it forward', () => {
    const terms = makeTerms(7)
    const round = createRound(terms, {}, terms, seeded())!
    const missedId = currentQuestion(round)!.term.id
    const afterWrong = answer(round, {}, false, terms, seeded(3))
    expect(afterWrong.stages).toEqual({})
    expect(afterWrong.round.queue).toHaveLength(8)
    const again = afterWrong.round.queue[7]
    expect(again).toMatchObject({ kind: 'choice', retry: true })
    expect(again.term.id).toBe(missedId)
    expect(again.options.map(o => o.id)).toContain(missedId)
    expect(isRoundOver(afterWrong.round)).toBe(false)
  })

  it('keeps asking until a missed term is answered correctly', () => {
    const terms = makeTerms(1)
    let state = { round: createRound(terms, {}, terms, seeded())!, stages: {} as Stages }
    for (let i = 0; i < 3; i++) state = answer(state.round, state.stages, false, terms, seeded())
    expect(isRoundOver(state.round)).toBe(false)
    expect(state.round.queue).toHaveLength(4)
    state = answer(state.round, state.stages, true, terms, seeded())
    expect(isRoundOver(state.round)).toBe(true)
    expect(state.stages).toEqual({ 1: 1 })
  })

  it('does nothing when the round is already over', () => {
    const terms = makeTerms(1)
    const done = answer(createRound(terms, {}, terms, seeded())!, {}, true, terms, seeded())
    expect(answer(done.round, done.stages, true, terms, seeded())).toEqual(done)
  })

  it('learns a 7-term deck in two rounds: multiple choice, then typed', () => {
    const terms = makeTerms(7)
    const first = play(createRound(terms, {}, terms, seeded())!, {}, terms)
    expect(first.asked.every(a => a.kind === 'choice')).toBe(true)
    expect(isComplete(terms, first.stages)).toBe(false)
    expect(learnProgress(terms, first.stages)).toEqual({ correct: 7, total: 14 })

    const second = play(createRound(terms, first.stages, terms, seeded())!, first.stages, terms)
    expect(second.asked.every(a => a.kind === 'typed')).toBe(true)
    expect(isComplete(terms, second.stages)).toBe(true)
    expect(learnProgress(terms, second.stages)).toEqual({ correct: 14, total: 14 })
    expect(createRound(terms, second.stages, terms, seeded())).toBeNull()
  })

  it('works through a longer deck 7 terms at a time', () => {
    const terms = makeTerms(16)
    let stages: Stages = {}
    const rounds: number[][] = []
    for (let round = createRound(terms, stages, terms, seeded()); round; round = createRound(terms, stages, terms, seeded())) {
      rounds.push(round.terms.map(t => t.id))
      stages = play(round, stages, terms).stages
    }
    expect(rounds).toHaveLength(6) // 7, 7 and 2 terms, each needing two rounds
    expect(rounds[0]).toEqual(rounds[1])
    expect(rounds[4]).toEqual([15, 16])
    expect(terms.every(t => isLearned(stages, t.id))).toBe(true)
  })

  it('a missed term appears twice in its round, the second time as a retry', () => {
    const terms = makeTerms(7)
    const { asked, stages } = play(createRound(terms, {}, terms, seeded())!, {}, terms, [3])
    expect(asked).toHaveLength(8)
    expect(asked.filter(a => a.id === 3)).toEqual([
      { id: 3, kind: 'choice', retry: false },
      { id: 3, kind: 'choice', retry: true },
    ])
    expect(asked[7].id).toBe(3)
    expect(stages[3]).toBe(1)
  })

  it('still works with fewer than four terms', () => {
    const one = makeTerms(1)
    expect(createRound(one, {}, one, seeded())!.queue[0].options).toHaveLength(1)
    const three = makeTerms(3)
    const round = createRound(three, {}, three, seeded())!
    expect(round.queue.every(q => q.options.length === 3 && q.options.some(o => o.id === q.term.id))).toBe(true)
  })

  it('takes wrong options from the whole deck when the category is small', () => {
    const deck = [...makeTerms(2, 'Small'), ...makeTerms(10, 'Big').map(t => ({ ...t, id: t.id + 100 }))]
    const round = createRound(deck.slice(0, 2), {}, deck, seeded())!
    expect(round.queue.every(q => q.options.length === 4)).toBe(true)
  })

  it('treats stages outside 0 to 2 safely', () => {
    const terms = makeTerms(2)
    expect(learnProgress(terms, { 1: 99, 2: -5 })).toEqual({ correct: 2, total: 4 })
  })
})
