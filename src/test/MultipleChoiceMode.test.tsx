import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AuthProvider } from '../auth/AuthProvider'
import { system } from '../Theme'
import MultipleChoiceMode from '../Pages/StudyPage/MultipleChoiceMode'
import { progressSync } from '../hooks/progressSync'

const terms = [1, 2, 3, 4, 5].map(id => ({ id, category: 'General', term: `Term ${id}`, definition: `Definition ${id}` }))

function renderQuiz() {
  localStorage.setItem('study-custom-decks', JSON.stringify([{ id: 'deck-x', name: 'Deck X', terms }]))
  return render(
    <ChakraProvider value={system}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/study/deck-x/quiz']}>
          <Routes>
            <Route path="/study/:deckId/quiz" element={<MultipleChoiceMode />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ChakraProvider>,
  )
}

const press = (key: string) => fireEvent.keyDown(window, { key })
const askedId = () => Number(screen.getByText(/^Definition \d+$/).textContent!.split(' ')[1])
/** The letter key for the option showing `Term <id>` on the current question. */
function letterFor(id: number) {
  const options = screen.getAllByRole('button').filter(b => /Term \d+$/.test(b.textContent ?? ''))
  return 'abcd'[options.findIndex(b => b.textContent!.endsWith(`Term ${id}`))]
}

beforeEach(() => {
  progressSync.signedOut()
  localStorage.clear()
})

describe('MultipleChoiceMode keyboard shortcuts', () => {
  it('answers and advances on the current question, several questions in a row', () => {
    renderQuiz()
    const asked: number[] = []
    for (let n = 1; n <= 3; n++) {
      expect(screen.getByText(`Q ${n} of 5`)).toBeTruthy()
      const id = askedId()
      asked.push(id)
      press(letterFor(id))
      // The key acted on this question, not an earlier one.
      expect(screen.getByText('Correct!')).toBeTruthy()
      expect(screen.getByText(new RegExp(`^${n} ✓`))).toBeTruthy()
      press('Enter')
    }
    expect(new Set(asked).size).toBe(3)
    expect(screen.getByText('Q 4 of 5')).toBeTruthy()
  })

  it('counts a wrong letter as wrong, ignores further letters, and Enter needs an answer first', () => {
    renderQuiz()
    press('Enter')
    expect(screen.getByText('Q 1 of 5')).toBeTruthy()
    const id = askedId()
    const wrong = 'abcd'.split('').find(l => l !== letterFor(id))!
    press(wrong)
    expect(screen.getByText('Not quite.')).toBeTruthy()
    press(letterFor(id))
    expect(screen.getByText(/^0 ✓/)).toBeTruthy()
    press('Enter')
    expect(screen.getByText('Q 2 of 5')).toBeTruthy()
  })
})
