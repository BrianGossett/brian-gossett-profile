import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { ReactNode } from 'react'
import { useStudySession } from '../hooks/useStudySession'
import { PROGRESS_KEY } from '../hooks/progressStore'
import { progressSync } from '../hooks/progressSync'

/** Renders the hook on a study-mode page for the given deck. */
const onDeck = (deckId: string) => ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={[`/study/${deckId}/flashcards`]}>
    <Routes><Route path="/study/:deckId/flashcards" element={children} /></Routes>
  </MemoryRouter>
)
const onHub = ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={['/study']}>{children}</MemoryRouter>

beforeEach(() => {
  progressSync.signedOut()
  localStorage.clear()
  sessionStorage.clear()
})

describe('useStudySession', () => {
  it('starts empty, with the same fields the study pages have always read', () => {
    const { result } = renderHook(() => useStudySession(), { wrapper: onDeck('default') })
    expect(result.current.session).toEqual({
      mastered: [],
      missed: [],
      missedCounts: {},
      streak: 0,
      lastMode: 'flashcards',
      lastCategory: 'all',
      lastDeckId: 'default',
      termCounts: { quiz: 20, type: 20, match: 20 },
      positions: { flashcards: 0, quiz: 0, type: 0, match: 0 },
      learn: {},
      starred: [],
    })
    expect(Object.keys(result.current).sort()).toEqual([
      'markMastered', 'markMissed', 'recordLearnAnswer', 'resetLearn', 'resetSession', 'session', 'setFlashcardFront', 'setLastCategory', 'setLastDeckId',
      'setLastMode', 'setPosition', 'setTermCount', 'toggleStar', 'weakTerms',
    ])
  })

  it('marks terms mastered and missed, as before', () => {
    const { result } = renderHook(() => useStudySession(), { wrapper: onDeck('default') })
    act(() => { result.current.markMissed(1) })
    act(() => { result.current.markMissed(1) })
    act(() => { result.current.markMastered(2) })
    act(() => { result.current.markMastered(3) })
    expect(result.current.session).toMatchObject({ mastered: [2, 3], missed: [1], missedCounts: { 1: 2 }, streak: 2 })
    expect(result.current.weakTerms).toEqual([1])

    act(() => { result.current.markMastered(1) })
    expect(result.current.session.missed).toEqual([])
    act(() => { result.current.markMissed(4) })
    expect(result.current.session.streak).toBe(0)
  })

  it('keeps progress on one deck separate from another', () => {
    const a = renderHook(() => useStudySession(), { wrapper: onDeck('deck-a') })
    act(() => { a.result.current.markMastered(1) })
    act(() => { a.result.current.setPosition('flashcards', 7) })

    const b = renderHook(() => useStudySession(), { wrapper: onDeck('deck-b') })
    expect(b.result.current.session.mastered).toEqual([])
    expect(b.result.current.session.positions.flashcards).toBe(0)
    act(() => { b.result.current.markMastered(1) })

    expect(a.result.current.session).toMatchObject({ mastered: [1], streak: 1, positions: { flashcards: 7 } })
  })

  it('keeps progress after the page is closed and reopened', () => {
    const first = renderHook(() => useStudySession(), { wrapper: onDeck('deck-a') })
    act(() => { first.result.current.markMastered(5) })
    first.unmount()
    sessionStorage.clear() // a new tab

    const second = renderHook(() => useStudySession(), { wrapper: onDeck('deck-a') })
    expect(second.result.current.session.mastered).toEqual([5])
    expect(JSON.parse(localStorage.getItem(PROGRESS_KEY)!)['deck-a'].mastered).toEqual([5])
  })

  it('shows the selected deck\'s progress on the Study page, where the URL has no deck', () => {
    const mode = renderHook(() => useStudySession(), { wrapper: onDeck('deck-a') })
    act(() => { mode.result.current.markMastered(1) })

    const hub = renderHook(() => useStudySession(), { wrapper: onHub })
    expect(hub.result.current.session.mastered).toEqual([])
    act(() => { hub.result.current.setLastDeckId('deck-a') })
    expect(hub.result.current.session).toMatchObject({ lastDeckId: 'deck-a', mastered: [1] })
  })

  it('reset clears only the current deck\'s progress and keeps preferences', () => {
    const a = renderHook(() => useStudySession(), { wrapper: onDeck('deck-a') })
    const b = renderHook(() => useStudySession(), { wrapper: onDeck('deck-b') })
    act(() => { a.result.current.markMastered(1) })
    act(() => { b.result.current.markMastered(2) })
    act(() => { a.result.current.setTermCount('quiz', 10) })
    act(() => { a.result.current.resetSession() })
    expect(a.result.current.session).toMatchObject({ mastered: [], streak: 0, termCounts: { quiz: 10 } })
    expect(b.result.current.session.mastered).toEqual([2])
  })

  it('keeps preferences app-wide', () => {
    const a = renderHook(() => useStudySession(), { wrapper: onDeck('deck-a') })
    act(() => { a.result.current.setLastMode('quiz') })
    act(() => { a.result.current.setLastCategory('Scales') })
    const b = renderHook(() => useStudySession(), { wrapper: onDeck('deck-b') })
    expect(b.result.current.session).toMatchObject({ lastMode: 'quiz', lastCategory: 'Scales' })
  })

  it('Learn: two correct answers learn a term, and a learned term is mastered', () => {
    const { result } = renderHook(() => useStudySession(), { wrapper: onDeck('deck-a') })
    act(() => { result.current.recordLearnAnswer(1, true) })
    expect(result.current.session).toMatchObject({ learn: { 1: 1 }, mastered: [], streak: 1 })
    act(() => { result.current.recordLearnAnswer(1, true) })
    expect(result.current.session).toMatchObject({ learn: { 1: 2 }, mastered: [1], streak: 2 })
    act(() => { result.current.recordLearnAnswer(1, true) })
    expect(result.current.session.learn).toEqual({ 1: 2 })
  })

  it('Learn: a wrong answer is a miss and does not move the term forward', () => {
    const { result } = renderHook(() => useStudySession(), { wrapper: onDeck('deck-a') })
    act(() => { result.current.recordLearnAnswer(1, true) })
    act(() => { result.current.recordLearnAnswer(1, false) })
    expect(result.current.session).toMatchObject({ learn: { 1: 1 }, missed: [1], missedCounts: { 1: 1 }, streak: 0 })
    act(() => { result.current.recordLearnAnswer(1, true) })
    expect(result.current.session).toMatchObject({ learn: { 1: 2 }, mastered: [1], missed: [] })
  })

  it('Learn: starting over clears the stages but keeps mastered marks', () => {
    const { result } = renderHook(() => useStudySession(), { wrapper: onDeck('deck-a') })
    act(() => { result.current.recordLearnAnswer(1, true) })
    act(() => { result.current.recordLearnAnswer(1, true) })
    act(() => { result.current.resetLearn() })
    expect(result.current.session).toMatchObject({ learn: {}, mastered: [1] })
  })

  it('stars and unstars terms per deck', () => {
    const a = renderHook(() => useStudySession(), { wrapper: onDeck('deck-a') })
    const b = renderHook(() => useStudySession(), { wrapper: onDeck('deck-b') })
    act(() => { a.result.current.toggleStar(3) })
    act(() => { a.result.current.toggleStar(5) })
    expect(a.result.current.session.starred).toEqual([3, 5])
    expect(b.result.current.session.starred).toEqual([])
    act(() => { a.result.current.toggleStar(3) })
    expect(a.result.current.session.starred).toEqual([5])
  })

  it('remembers which side flashcards show first, per deck', () => {
    const first = renderHook(() => useStudySession(), { wrapper: onDeck('deck-a') })
    expect(first.result.current.session.flashcardFront).toBeUndefined()
    act(() => { first.result.current.setFlashcardFront('definition') })
    first.unmount()

    const again = renderHook(() => useStudySession(), { wrapper: onDeck('deck-a') })
    expect(again.result.current.session.flashcardFront).toBe('definition')
    const other = renderHook(() => useStudySession(), { wrapper: onDeck('deck-b') })
    expect(other.result.current.session.flashcardFront).toBeUndefined()
  })

  it('keeps stars and the flashcard side when progress is reset', () => {
    const { result } = renderHook(() => useStudySession(), { wrapper: onDeck('deck-a') })
    act(() => { result.current.toggleStar(1) })
    act(() => { result.current.setFlashcardFront('definition') })
    act(() => { result.current.markMastered(1) })
    act(() => { result.current.resetSession() })
    expect(result.current.session).toMatchObject({ mastered: [], streak: 0, starred: [1], flashcardFront: 'definition' })
  })
})
