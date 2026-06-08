import { describe, it, expect } from 'vitest'
import { sampleScoreQuestions, ALL_SCORES } from '../data/scores'

describe('sampleScoreQuestions', () => {
  it('returns at most count questions', () => {
    const result = sampleScoreQuestions(ALL_SCORES, 1)
    expect(result.length).toBeLessThanOrEqual(1)
  })

  it('returns all questions when count exceeds total', () => {
    const total = ALL_SCORES.reduce((s, sc) => s + sc.questions.length, 0)
    const result = sampleScoreQuestions(ALL_SCORES, 9999)
    expect(result.length).toBe(total)
  })

  it('each result has score, question, and questionIndex', () => {
    if (ALL_SCORES.length === 0) return
    const result = sampleScoreQuestions(ALL_SCORES, 2)
    for (const item of result) {
      expect(item.score).toBeDefined()
      expect(item.question.prompt).toBeDefined()
      expect(item.question.modelAnswer).toBeDefined()
      expect(typeof item.questionIndex).toBe('number')
    }
  })
})
