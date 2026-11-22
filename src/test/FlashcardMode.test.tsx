import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AuthProvider } from '../auth/AuthProvider'
import { system } from '../Theme'
import FlashcardMode from '../Pages/StudyPage/FlashcardMode'
import { PROGRESS_KEY } from '../hooks/progressStore'
import { progressSync } from '../hooks/progressSync'

const terms = [1, 2, 3, 4].map(id => ({ id, category: 'General', term: `Term ${id}`, definition: `Definition ${id}` }))

function renderCards(deckId = 'deck-x') {
  localStorage.setItem('study-custom-decks', JSON.stringify([{ id: 'deck-x', name: 'Deck X', terms }]))
  return render(
    <ChakraProvider value={system}>
      <AuthProvider>
        <MemoryRouter initialEntries={[`/study/${deckId}/flashcards`]}>
          <Routes>
            <Route path="/study/:deckId/flashcards" element={<FlashcardMode />} />
            <Route path="/study" element={<div>Study hub</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ChakraProvider>,
  )
}

const button = (name: string | RegExp) => screen.getByRole('button', { name })
const gotIt = () => fireEvent.click(button('Got it'))
const stillLearning = () => fireEvent.click(button('Still learning'))
const saved = (deckId = 'deck-x') => JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}')[deckId]

beforeEach(() => {
  progressSync.signedOut()
  localStorage.clear()
  sessionStorage.clear()
})

describe('Flashcards: existing behavior', () => {
  it('shows the term first and flips to the definition', () => {
    renderCards()
    expect(screen.getByText('Term 1')).toBeTruthy()
    expect(screen.queryByText('Definition 1')).toBeNull()
    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.getByText('Definition 1')).toBeTruthy()
  })

  it('rates cards with the arrow keys and records progress', () => {
    renderCards()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText('Card 3 of 4')).toBeTruthy()
    expect(saved()).toMatchObject({ mastered: [1], missed: [2], positions: { flashcards: 2 } })
  })
})

describe('Flashcards: front side', () => {
  it('switches to definition first, and remembers the choice', () => {
    const first = renderCards()
    fireEvent.click(button('Show the definition first'))
    expect(screen.getByText('Definition 1')).toBeTruthy()
    expect(screen.queryByText('Term 1')).toBeNull()
    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.getByText('Term 1')).toBeTruthy()
    expect(saved().flashcardFront).toBe('definition')
    first.unmount()

    renderCards()
    expect(screen.getByText('Definition 1')).toBeTruthy()
    expect(button('Show the term first')).toBeTruthy()
  })

  it('shows a question-and-answer deck question first, and can be switched', () => {
    renderCards('pokemon-types')
    expect(screen.getByText(/^(What|Which) /)).toBeTruthy()
    expect(screen.getByText(/Click to reveal answer/i)).toBeTruthy()
    fireEvent.click(button('Show the answer first'))
    expect(screen.queryByText(/^(What|Which) /)).toBeNull()
    expect(screen.getByText(/Click to reveal question/i)).toBeTruthy()
    expect(saved('pokemon-types').flashcardFront).toBe('term')
  })
})

describe('Flashcards: stars', () => {
  it('stars and unstars a card, with the button and the S key', () => {
    renderCards()
    expect(button('Star this card').getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(button('Star this card'))
    expect(button('Remove star').getAttribute('aria-pressed')).toBe('true')
    expect(saved().starred).toEqual([1])
    fireEvent.keyDown(window, { key: 's' })
    expect(saved().starred).toEqual([])
  })

  it('starring does not flip the card', () => {
    renderCards()
    fireEvent.click(button('Star this card'))
    expect(screen.getByText('Term 1')).toBeTruthy()
    expect(screen.queryByText('Definition 1')).toBeNull()
  })

  it('keeps stars after a reload', () => {
    const first = renderCards()
    fireEvent.click(button('Star this card'))
    first.unmount()
    renderCards()
    expect(button('Remove star')).toBeTruthy()
  })

  it('cannot study starred cards when nothing is starred', () => {
    renderCards()
    const chip = button('Study starred cards only')
    expect(chip.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(chip)
    expect(screen.getByText('Card 1 of 4')).toBeTruthy()
  })

  it('studies only the starred cards, then goes back to all of them', () => {
    renderCards()
    gotIt() // card 1
    fireEvent.click(button('Star this card')) // star card 2
    gotIt()
    gotIt() // card 3
    fireEvent.click(button('Star this card')) // star card 4

    fireEvent.click(button('Study starred cards only'))
    expect(screen.getByText('Card 1 of 2')).toBeTruthy()
    expect(screen.getByText('Term 2')).toBeTruthy()
    gotIt()
    expect(screen.getByText('Term 4')).toBeTruthy()

    fireEvent.click(button('Study starred cards only'))
    expect(screen.getByText('Card 1 of 4')).toBeTruthy()
  })
})

describe('Flashcards: re-studying missed cards', () => {
  it('offers the missed cards after a pass, and repeats until none are missed', () => {
    renderCards()
    gotIt()          // 1
    stillLearning()  // 2
    gotIt()          // 3
    stillLearning()  // 4
    expect(screen.getByText('All done!')).toBeTruthy()

    fireEvent.click(button('Study the 2 cards you missed'))
    expect(screen.getByText('Card 1 of 2')).toBeTruthy()
    expect(screen.getByText('Term 2')).toBeTruthy()
    expect(screen.getByText('Studying the cards you missed')).toBeTruthy()
    gotIt()          // 2
    stillLearning()  // 4 again

    fireEvent.click(button('Study the 1 card you missed'))
    expect(screen.getByText('Term 4')).toBeTruthy()
    gotIt()

    expect(screen.getByText('All done!')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /you missed/ })).toBeNull()
    expect(button('Restart Deck')).toBeTruthy()
  })

  it('does not offer it after a clean pass', () => {
    renderCards()
    for (let i = 0; i < 4; i++) gotIt()
    expect(screen.getByText('All done!')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /you missed/ })).toBeNull()
  })

  it('restarts the whole deck from the end screen', () => {
    renderCards()
    stillLearning()
    for (let i = 0; i < 3; i++) gotIt()
    fireEvent.click(button('Restart Deck'))
    expect(screen.getByText('Card 1 of 4')).toBeTruthy()
    expect(screen.getByText('Term 1')).toBeTruthy()
  })

  it('does not save a position from a pass over part of the deck', () => {
    renderCards()
    stillLearning()
    for (let i = 0; i < 3; i++) gotIt()
    fireEvent.click(button('Study the 1 card you missed'))
    gotIt()
    expect(saved().positions.flashcards).toBe(4) // where the full pass ended
  })
})
