import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AuthProvider } from '../auth/AuthProvider'
import { system } from '../Theme'
import LearnMode, { CORRECT_DELAY_MS } from '../Pages/StudyPage/LearnMode'
import { PROGRESS_KEY } from '../hooks/progressStore'
import { progressSync } from '../hooks/progressSync'

const terms = [1, 2, 3].map(id => ({ id, category: 'General', term: `Term ${id}`, definition: `Definition ${id}` }))

function renderLearn(deckTerms = terms) {
  localStorage.setItem('study-custom-decks', JSON.stringify([{ id: 'deck-x', name: 'Deck X', terms: deckTerms }]))
  return render(
    <ChakraProvider value={system}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/study/deck-x/learn']}>
          <Routes>
            <Route path="/study/:deckId/learn" element={<LearnMode />} />
            <Route path="/study" element={<div>Study hub</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ChakraProvider>,
  )
}

/** The number of the term whose definition is on screen. */
const askedId = () => Number(screen.getByText(/^Definition \d+$/).textContent!.split(' ')[1])
const option = (id: number) => screen.getByRole('button', { name: new RegExp(`Term ${id}$`) })
const afterCorrect = () => act(() => { vi.advanceTimersByTime(CORRECT_DELAY_MS) })
const saved = () => JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}')['deck-x']
/** The bucket counts shown at the top, as [unstarted, familiar, mastered]. */
const bucketCounts = () => /Unstarted (\d+), Familiar (\d+), Mastered (\d+)/.exec(screen.getByRole('group', { name: /^Unstarted/ }).getAttribute('aria-label')!)!.slice(1).map(Number)

function answerChoiceCorrectly() {
  fireEvent.click(option(askedId()))
  afterCorrect()
}

function answerTypedCorrectly() {
  const id = askedId()
  fireEvent.change(screen.getByLabelText('Your answer'), { target: { value: `term ${id}` } })
  fireEvent.click(screen.getByRole('button', { name: 'Check' }))
  afterCorrect()
}

beforeEach(() => {
  progressSync.signedOut()
  localStorage.clear()
  sessionStorage.clear()
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

describe('LearnMode', () => {
  it('starts with a multiple-choice question and every term unstarted', () => {
    renderLearn()
    expect(screen.getByText('Which term is this?')).toBeTruthy()
    expect(bucketCounts()).toEqual([3, 0, 0])
    for (const id of [1, 2, 3]) expect(option(id)).toBeTruthy()
  })

  it('moves on by itself after a correct answer', () => {
    renderLearn()
    const first = askedId()
    fireEvent.click(option(first))
    expect(screen.getByText('Correct!')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Continue/ })).toBeNull()
    afterCorrect()
    expect(askedId()).not.toBe(first)
    expect(bucketCounts()).toEqual([2, 1, 0])
  })

  it('shows the answer after a wrong one, waits, and asks it again before the round ends', () => {
    renderLearn()
    const missed = askedId()
    const wrong = [1, 2, 3].find(id => id !== missed)!
    fireEvent.click(option(wrong))
    expect(screen.getByText('Not yet.')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain(`Term ${missed}`)

    // It does not move on by itself.
    act(() => { vi.advanceTimersByTime(5000) })
    expect(askedId()).toBe(missed)
    expect(bucketCounts()).toEqual([3, 0, 0])

    fireEvent.click(screen.getByRole('button', { name: /Continue/ }))
    answerChoiceCorrectly()
    answerChoiceCorrectly()
    // The missed term comes back, marked as a retry, before the recap.
    expect(askedId()).toBe(missed)
    expect(screen.getByText('Try again')).toBeTruthy()
    answerChoiceCorrectly()
    expect(screen.getByText('Round complete')).toBeTruthy()
  })

  it('"Don\'t know" counts as a wrong answer', () => {
    renderLearn()
    fireEvent.click(screen.getByRole('button', { name: "Don't know" }))
    expect(screen.getByText('Not yet.')).toBeTruthy()
    expect(saved().missed).toHaveLength(1)
  })

  it('answers with the number keys', () => {
    renderLearn()
    const id = askedId()
    const position = screen.getAllByRole('button').filter(b => /Term \d$/.test(b.textContent ?? '')).findIndex(b => b.textContent!.endsWith(`Term ${id}`))
    fireEvent.keyDown(window, { key: String(position + 1) })
    expect(screen.getByText('Correct!')).toBeTruthy()
  })

  it('ends the round with a recap of its terms, then asks for typed answers', () => {
    renderLearn()
    for (let i = 0; i < 3; i++) answerChoiceCorrectly()
    expect(screen.getByText('Round complete')).toBeTruthy()
    expect(bucketCounts()).toEqual([0, 3, 0])
    for (const id of [1, 2, 3]) {
      expect(screen.getByText(`Term ${id}`)).toBeTruthy()
      expect(screen.getByText(`Definition ${id}`)).toBeTruthy()
    }

    fireEvent.click(screen.getByRole('button', { name: /Next round/ }))
    expect(screen.getByText('Type the term')).toBeTruthy()
    expect(screen.getByLabelText('Your answer')).toBeTruthy()
  })

  it('learns the whole deck and shows a finish screen', () => {
    renderLearn()
    for (let i = 0; i < 3; i++) answerChoiceCorrectly()
    fireEvent.click(screen.getByRole('button', { name: /Next round/ }))
    for (let i = 0; i < 3; i++) answerTypedCorrectly()
    expect(screen.getByText('That was the last round')).toBeTruthy()
    expect(bucketCounts()).toEqual([0, 0, 3])
    fireEvent.click(screen.getByRole('button', { name: /Finish/ }))
    expect(screen.getByText("You've learned every term")).toBeTruthy()
    expect(saved()).toMatchObject({ learn: { 1: 2, 2: 2, 3: 2 } })
    expect(saved().mastered.sort()).toEqual([1, 2, 3])
  })

  it('a wrong typed answer must be retyped, and sends the term back to multiple choice', () => {
    renderLearn()
    for (let i = 0; i < 3; i++) answerChoiceCorrectly()
    fireEvent.click(screen.getByRole('button', { name: /Next round/ }))
    const id = askedId()
    fireEvent.change(screen.getByLabelText('Your answer'), { target: { value: 'something else' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByText('Not yet.')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain(`Term ${id}`)
    expect(screen.getByRole('status').textContent).toContain('goes back to multiple choice')
    expect(saved().learn[id]).toBeUndefined() // dropped back to the start
    expect(bucketCounts()).toEqual([1, 2, 0])

    // There is no way on except typing the right answer.
    expect(screen.queryByRole('button', { name: /^Continue →/ })).toBeNull()
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(askedId()).toBe(id)
    const retype = screen.getByLabelText('Retype the correct answer')
    fireEvent.change(retype, { target: { value: 'still wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('alert').textContent).toContain("doesn't match yet")
    expect(askedId()).toBe(id)

    fireEvent.change(retype, { target: { value: `term ${id}` } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(askedId()).not.toBe(id)

    // It returns before the round ends, as multiple choice again.
    answerTypedCorrectly()
    answerTypedCorrectly()
    expect(askedId()).toBe(id)
    expect(screen.getByText('Which term is this?')).toBeTruthy()
    expect(screen.getByText('Try again')).toBeTruthy()
  })

  it('"Don\'t know" on a typed question also requires retyping', () => {
    renderLearn()
    for (let i = 0; i < 3; i++) answerChoiceCorrectly()
    fireEvent.click(screen.getByRole('button', { name: /Next round/ }))
    fireEvent.click(screen.getByRole('button', { name: "Don't know" }))
    expect(screen.getByLabelText('Retype the correct answer')).toBeTruthy()
  })

  it('shows miss counts in the round recap', () => {
    renderLearn()
    const missed = askedId()
    fireEvent.click(option([1, 2, 3].find(id => id !== missed)!))
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }))
    for (let i = 0; i < 3; i++) answerChoiceCorrectly()
    expect(screen.getByText('Round complete')).toBeTruthy()
    expect(screen.getByText('1 miss')).toBeTruthy()
    expect(screen.getAllByText('clean ✓')).toHaveLength(2)
  })

  it('lists the trickiest cards on the finish screen', () => {
    renderLearn()
    const missed = askedId()
    fireEvent.click(option([1, 2, 3].find(id => id !== missed)!))
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }))
    for (let i = 0; i < 3; i++) answerChoiceCorrectly()
    fireEvent.click(screen.getByRole('button', { name: /Next round/ }))
    for (let i = 0; i < 3; i++) answerTypedCorrectly()
    fireEvent.click(screen.getByRole('button', { name: /Finish/ }))
    expect(screen.getByText('Trickiest cards')).toBeTruthy()
    expect(screen.getByText(`Term ${missed}`)).toBeTruthy()
    expect(screen.getByText(/1 miss along the way/)).toBeTruthy()
  })

  it('says so when a session had no misses', () => {
    renderLearn()
    for (let i = 0; i < 3; i++) answerChoiceCorrectly()
    fireEvent.click(screen.getByRole('button', { name: /Next round/ }))
    for (let i = 0; i < 3; i++) answerTypedCorrectly()
    fireEvent.click(screen.getByRole('button', { name: /Finish/ }))
    expect(screen.getByText(/Not a single miss/)).toBeTruthy()
    expect(screen.queryByText('Trickiest cards')).toBeNull()
  })

  it('resumes from the saved stages when reopened', () => {
    const first = renderLearn()
    for (let i = 0; i < 3; i++) answerChoiceCorrectly()
    first.unmount()

    renderLearn()
    expect(bucketCounts()).toEqual([0, 3, 0])
    expect(screen.getByText('Type the term')).toBeTruthy()
  })

  it('starts over from the finish screen', () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ 'deck-x': { learn: { 1: 2, 2: 2, 3: 2 }, mastered: [1, 2, 3] } }))
    renderLearn()
    expect(screen.getByText("You've learned every term")).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Start over' }))
    expect(screen.getByText('Which term is this?')).toBeTruthy()
    expect(bucketCounts()).toEqual([3, 0, 0])
  })

  it('works with a one-term deck', () => {
    renderLearn([terms[0]])
    expect(bucketCounts()).toEqual([1, 0, 0])
    answerChoiceCorrectly()
    expect(screen.getByText('Round complete')).toBeTruthy()
  })
})

describe('LearnMode sessions', () => {
  const many = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, category: 'General', term: `Term ${i + 1}`, definition: `Definition ${i + 1}` }))

  it('asks how many terms to study when there are more than 10 left', () => {
    renderLearn(many)
    expect(screen.getByText('How many terms this session?')).toBeTruthy()
    expect(screen.getByRole('button', { name: '10 terms' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '20 terms' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'All 25' })).toBeTruthy()
    expect(bucketCounts()).toEqual([25, 0, 0])
  })

  it('a session of 10 covers only 10 terms, in rounds of 7', () => {
    renderLearn(many)
    fireEvent.click(screen.getByRole('button', { name: '10 terms' }))
    expect(bucketCounts()).toEqual([10, 0, 0])
    const seen = new Set<number>()
    for (let i = 0; i < 7; i++) { seen.add(askedId()); answerChoiceCorrectly() }
    expect(screen.getByText('Round complete')).toBeTruthy()
    expect(seen.size).toBe(7)
    expect([...seen].every(id => id <= 10)).toBe(true)
    expect(bucketCounts()).toEqual([3, 7, 0])
  })

  it('only offers sizes smaller than what is left', () => {
    renderLearn(many.slice(0, 15))
    expect(screen.getByRole('button', { name: '10 terms' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '20 terms' })).toBeNull()
    expect(screen.getByRole('button', { name: 'All 15' })).toBeTruthy()
  })

  it('shows what was recognised while typing a list answer', () => {
    const list = [1, 2, 3].map(id => ({ id, category: 'General', term: `Alpha${id}, Bravo${id}, Charlie${id}`, definition: `Definition ${id}` }))
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ 'deck-x': { learn: { 1: 1, 2: 1, 3: 1 } } }))
    renderLearn(list)
    const id = askedId()
    fireEvent.change(screen.getByLabelText('Your answer'), { target: { value: `bravo${id}, nonsense` } })
    const preview = screen.getByRole('group', { name: 'Recognised so far' })
    expect(preview.textContent).toContain(`Bravo${id}`)
    expect(preview.textContent).toContain('nonsense?')
  })
})
