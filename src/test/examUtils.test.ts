import { describe, it, expect } from 'vitest'
import { ALL_TERMS } from '../data/terms'
import {
  selectTermsForExam,
  canFillInBlank,
  fillInBlank,
  getDistractors6,
  buildDrillQuestions,
} from '../Pages/ExamPrepPage/examUtils'

describe('selectTermsForExam', () => {
  it('returns exactly count terms', () => {
    const result = selectTermsForExam(ALL_TERMS, 12, 6)
    expect(result).toHaveLength(12)
  })

  it('covers at least minCategories distinct categories', () => {
    const result = selectTermsForExam(ALL_TERMS, 12, 6)
    const cats = new Set(result.map(t => t.category))
    expect(cats.size).toBeGreaterThanOrEqual(6)
  })

  it('returns no duplicate ids', () => {
    const result = selectTermsForExam(ALL_TERMS, 12, 6)
    const ids = result.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('returns fewer terms when pool is smaller than count', () => {
    const small = ALL_TERMS.slice(0, 5)
    const result = selectTermsForExam(small, 12, 1)
    expect(result).toHaveLength(5)
  })
})

describe('canFillInBlank', () => {
  it('returns true when term name appears in its definition', () => {
    const term = { id: 99, category: 'Test', term: 'Dorian', definition: 'The Dorian mode is a minor mode.' }
    expect(canFillInBlank(term)).toBe(true)
  })

  it('returns false when term name does not appear in definition', () => {
    const term = { id: 99, category: 'Test', term: 'Dorian', definition: 'A minor mode with a raised sixth scale degree.' }
    expect(canFillInBlank(term)).toBe(false)
  })
})

describe('fillInBlank', () => {
  it('replaces all occurrences of the term name with _____', () => {
    const term = { id: 99, category: 'Test', term: 'Dorian', definition: 'Dorian is a mode. The Dorian scale...' }
    expect(fillInBlank(term)).toBe('_____ is a mode. The _____ scale...')
  })

  it('replacement is case-insensitive', () => {
    const term = { id: 99, category: 'Test', term: 'Dorian', definition: 'dorian and DORIAN modes.' }
    expect(fillInBlank(term)).toBe('_____ and _____ modes.')
  })
})

describe('getDistractors6', () => {
  it('returns exactly 5 distractors', () => {
    const correct = ALL_TERMS[0]
    const result = getDistractors6(correct, ALL_TERMS)
    expect(result).toHaveLength(5)
  })

  it('does not include the correct term', () => {
    const correct = ALL_TERMS[0]
    const result = getDistractors6(correct, ALL_TERMS)
    expect(result.find(d => d.id === correct.id)).toBeUndefined()
  })

  it('includes at least one term from a different category', () => {
    const correct = ALL_TERMS.find(t => t.category === 'Modes')!
    const result = getDistractors6(correct, ALL_TERMS)
    expect(result.some(d => d.category !== 'Modes')).toBe(true)
  })
})

describe('buildDrillQuestions', () => {
  const cats = [...new Set(ALL_TERMS.map(t => t.category))]

  it('returns at most count questions', () => {
    const result = buildDrillQuestions(ALL_TERMS, 10, cats)
    expect(result.length).toBeLessThanOrEqual(10)
  })

  it('extended-pool questions have 6 options', () => {
    for (let i = 0; i < 5; i++) {
      const result = buildDrillQuestions(ALL_TERMS, 20, cats)
      const ep = result.find(q => q.type === 'extended-pool')
      if (ep) { expect(ep.options).toHaveLength(6); break }
    }
  })

  it('fill-blank questions have blankedDef', () => {
    for (let i = 0; i < 5; i++) {
      const result = buildDrillQuestions(ALL_TERMS, 20, cats)
      const fb = result.find(q => q.type === 'fill-blank')
      if (fb) { expect(fb.blankedDef).toContain('_____'); break }
    }
  })

  it('category-id questions have allCategories', () => {
    for (let i = 0; i < 5; i++) {
      const result = buildDrillQuestions(ALL_TERMS, 20, cats)
      const ci = result.find(q => q.type === 'category-id')
      if (ci) { expect(Array.isArray(ci.allCategories)).toBe(true); break }
    }
  })
})
