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
  it('starts with a multiple-choice question and shows progress out of terms × 2', () => {
    renderLearn()
    expect(screen.getByText('Which term is this?')).toBeTruthy()
    expect(screen.getByText('0 of 6 correct')).toBeTruthy()
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
    expect(screen.getByText('1 of 6 correct')).toBeTruthy()
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
    expect(screen.getByText('0 of 6 correct')).toBeTruthy()

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
    expect(screen.getByText('3 of 6 correct')).toBeTruthy()
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
    expect(screen.getByText('6 of 6 correct')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Finish/ }))
    expect(screen.getByText("You've learned every term")).toBeTruthy()
    expect(saved()).toMatchObject({ learn: { 1: 2, 2: 2, 3: 2 } })
    expect(saved().mastered.sort()).toEqual([1, 2, 3])
  })

  it('marks a wrong typed answer and shows the right one', () => {
    renderLearn()
    for (let i = 0; i < 3; i++) answerChoiceCorrectly()
    fireEvent.click(screen.getByRole('button', { name: /Next round/ }))
    const id = askedId()
    fireEvent.change(screen.getByLabelText('Your answer'), { target: { value: 'something else' } })
    fireEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByText('Not yet.')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain(`Term ${id}`)
    expect(saved().learn[id]).toBe(1) // still needs its typed answer
  })

  it('resumes from the saved stages when reopened', () => {
    const first = renderLearn()
    for (let i = 0; i < 3; i++) answerChoiceCorrectly()
    first.unmount()

    renderLearn()
    expect(screen.getByText('3 of 6 correct')).toBeTruthy()
    expect(screen.getByText('Type the term')).toBeTruthy()
  })

  it('starts over from the finish screen', () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ 'deck-x': { learn: { 1: 2, 2: 2, 3: 2 }, mastered: [1, 2, 3] } }))
    renderLearn()
    expect(screen.getByText("You've learned every term")).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Start over' }))
    expect(screen.getByText('Which term is this?')).toBeTruthy()
    expect(screen.getByText('0 of 6 correct')).toBeTruthy()
  })

  it('works with a one-term deck', () => {
    renderLearn([terms[0]])
    expect(screen.getByText('0 of 2 correct')).toBeTruthy()
    answerChoiceCorrectly()
    expect(screen.getByText('Round complete')).toBeTruthy()
  })
})
