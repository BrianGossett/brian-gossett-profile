import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AuthProvider } from '../auth/AuthProvider'
import { system } from '../Theme'
import MatchingMode from '../Pages/StudyPage/MatchingMode'
import { PROGRESS_KEY } from '../hooks/progressStore'
import { progressSync } from '../hooks/progressSync'
import { WRONG_MATCH_PENALTY_SECONDS, formatSeconds, isNewBest, roundTime } from '../utils/matchTimer'

describe('match timing', () => {
  it('adds 5 seconds for each wrong match', () => {
    expect(WRONG_MATCH_PENALTY_SECONDS).toBe(5)
    expect(roundTime(1000, 13_500, 0)).toBe(12.5)
    expect(roundTime(1000, 13_500, 2)).toBe(22.5)
    expect(roundTime(5000, 1000, 0)).toBe(0)
  })

  it('treats the first time as a best, and only a faster time after that', () => {
    expect(isNewBest(undefined, 30)).toBe(true)
    expect(isNewBest(30, 29.9)).toBe(true)
    expect(isNewBest(30, 30)).toBe(false)
    expect(isNewBest(30, 31)).toBe(false)
  })

  it('formats times to a tenth of a second', () => {
    expect(formatSeconds(0)).toBe('0.0s')
    expect(formatSeconds(12.34)).toBe('12.3s')
    expect(formatSeconds(59.96)).toBe('1:00.0')
    expect(formatSeconds(65.2)).toBe('1:05.2')
  })
})

const terms = [1, 2, 3].map(id => ({ id, category: 'General', term: `Term ${id}`, definition: `Definition ${id}` }))

function renderMatch() {
  localStorage.setItem('study-custom-decks', JSON.stringify([{ id: 'deck-x', name: 'Deck X', terms }]))
  return render(
    <ChakraProvider value={system}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/study/deck-x/match']}>
          <Routes>
            <Route path="/study/:deckId/match" element={<MatchingMode />} />
            <Route path="/study" element={<div>Study hub</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ChakraProvider>,
  )
}

const click = (text: string) => fireEvent.click(screen.getByText(text))
const pair = (term: number, definition = term) => { click(`Term ${term}`); click(`Definition ${definition}`) }
const wait = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })
const clock = () => screen.getByRole('timer').textContent
const saved = () => JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}')['deck-x']

beforeEach(() => {
  progressSync.signedOut()
  localStorage.clear()
  sessionStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-21T12:00:00Z'))
})
afterEach(() => vi.useRealTimers())

describe('Matching timer', () => {
  it('does not start until the first tile is clicked', () => {
    renderMatch()
    wait(10_000)
    expect(clock()).toBe('0.0s')
    click('Term 1')
    wait(2000)
    expect(clock()).toBe('2.0s')
  })

  it('adds 5 seconds for a wrong match and shows it', () => {
    renderMatch()
    click('Term 1')
    wait(1000)
    click('Definition 2') // wrong
    expect(screen.getByText('+5s')).toBeTruthy()
    wait(400) // the red flash clears
    expect(clock()).toBe('6.4s')
    expect(screen.getByText(/1 wrong attempt this round/).textContent).toContain('+5s')
  })

  it('stops on the last pair and shows the final time', () => {
    renderMatch()
    pair(1)
    wait(3000)
    pair(2)
    wait(2000)
    pair(3)
    wait(400)
    expect(screen.getByText('Round Complete! 🎉')).toBeTruthy()
    expect(clock()).toBe('5.0s')
    expect(screen.getAllByText('5.0s')).toHaveLength(2) // on the clock and in the summary
    wait(10_000)
    expect(clock()).toBe('5.0s') // the clock has stopped
    expect(screen.getByText("First time for 3 pairs. That's your best so far.")).toBeTruthy()
    expect(saved().bestMatch).toEqual({ 3: 5 })
  })

  it('includes penalties in the final time', () => {
    renderMatch()
    click('Term 1'); click('Definition 3') // wrong
    wait(400)
    click('Term 1'); click('Definition 2') // wrong again
    wait(600)
    pair(1); pair(2); pair(3)
    wait(400)
    expect(clock()).toBe('11.0s') // 1.0s on the clock + 2 × 5s
    expect(screen.getByText(/2 wrong attempts/).textContent).toContain('(+10s)')
  })

  it('keeps the best time across visits and says when it is beaten', () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ 'deck-x': { bestMatch: { 3: 8 } } }))
    const first = renderMatch()
    expect(screen.getByText(/Best for 3 pairs: 8\.0s/)).toBeTruthy()
    pair(1); wait(9000); pair(2); pair(3); wait(400)
    expect(screen.getByText('Best for 3 pairs: 8.0s')).toBeTruthy()
    expect(saved().bestMatch).toEqual({ 3: 8 }) // a slower round doesn't replace it
    first.unmount()

    renderMatch()
    pair(1); wait(2000); pair(2); pair(3); wait(400)
    expect(screen.getByText('New best for 3 pairs! It was 8.0s.')).toBeTruthy()
    expect(saved().bestMatch).toEqual({ 3: 2 })
  })
})
