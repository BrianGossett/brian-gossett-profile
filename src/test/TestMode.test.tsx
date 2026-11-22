import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AuthProvider } from '../auth/AuthProvider'
import { system } from '../Theme'
import TestMode from '../Pages/StudyPage/TestMode'
import { PROGRESS_KEY } from '../hooks/progressStore'
import { progressSync } from '../hooks/progressSync'

const terms = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, category: 'General', term: `Term ${i + 1}`, definition: `Definition ${i + 1}` }))

function renderTest() {
  localStorage.setItem('study-custom-decks', JSON.stringify([{ id: 'deck-x', name: 'Deck X', terms }]))
  return render(
    <ChakraProvider value={system}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/study/deck-x/test']}>
          <Routes>
            <Route path="/study/:deckId/test" element={<TestMode />} />
            <Route path="/study" element={<div>Study hub</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ChakraProvider>,
  )
}

const button = (name: string | RegExp) => screen.getByRole('button', { name })
const toggle = (name: string) => fireEvent.click(button(name))
const setCount = (n: number) => fireEvent.change(screen.getByLabelText('Number of questions'), { target: { value: String(n) } })
const saved = () => JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}')['deck-x']
/** The definition number shown in a multiple-choice or written question card. */
const idIn = (card: HTMLElement) => Number(/Definition (\d+)/.exec(card.textContent!)![1])
const cardOf = (group: HTMLElement) => group.closest('div[class]')!.parentElement as HTMLElement

beforeEach(() => {
  progressSync.signedOut()
  localStorage.clear()
  sessionStorage.clear()
})

describe('TestMode setup', () => {
  it('opens on a setup screen with multiple choice selected', () => {
    renderTest()
    expect(screen.getByText('Set up your test')).toBeTruthy()
    expect(button('Multiple choice').getAttribute('aria-pressed')).toBe('true')
    expect(button('Written').getAttribute('aria-pressed')).toBe('false')
    expect((screen.getByLabelText('Number of questions') as HTMLInputElement).value).toBe('12')
  })

  it('limits the question count to the terms available', () => {
    renderTest()
    setCount(500)
    expect((screen.getByLabelText('Number of questions') as HTMLInputElement).value).toBe('12')
    setCount(0)
    expect((screen.getByLabelText('Number of questions') as HTMLInputElement).value).toBe('1')
  })

  it('refuses to start with no question type selected', () => {
    renderTest()
    toggle('Multiple choice')
    expect(screen.getByRole('alert').textContent).toContain('at least one question type')
    fireEvent.click(button('Start test'))
    expect(screen.getByText('Set up your test')).toBeTruthy()
  })
})

describe('TestMode', () => {
  it('shows every selected type on one page, grouped in order', () => {
    renderTest()
    for (const type of ['True / false', 'Matching', 'Written']) toggle(type)
    setCount(8)
    fireEvent.click(button('Start test'))

    const labels = screen.getAllByText(/^(True \/ false|Multiple choice|Matching|Written)$/).map(e => e.textContent)
    expect([...new Set(labels)]).toEqual(['True / false', 'Multiple choice', 'Matching', 'Written'])
    expect(screen.getByText('0 of 8 answered')).toBeTruthy()
    expect(screen.getByText('1 of 8')).toBeTruthy()
    expect(screen.getByText('5-6 of 8')).toBeTruthy()
    expect(screen.getByText('8 of 8')).toBeTruthy()
  })

  it('asks before grading when questions were skipped, and can go back', () => {
    renderTest()
    setCount(3)
    fireEvent.click(button('Start test'))
    fireEvent.click(button('Submit test'))

    const dialog = screen.getByRole('alertdialog')
    expect(dialog.textContent).toContain('You skipped 3 questions')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Review skipped questions' }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(button('Submit test')).toBeTruthy()
    expect(saved()).toBeUndefined() // nothing graded yet
  })

  it('grades a multiple-choice test and reviews every question', () => {
    renderTest()
    setCount(3)
    fireEvent.click(button('Start test'))

    // Answer the first two correctly and the third wrongly.
    const groups = [1, 2, 3].map(n => screen.getByRole('group', { name: `Question ${n}` }))
    const ids = groups.map(g => idIn(cardOf(g)))
    fireEvent.click(within(groups[0]).getByRole('button', { name: `Term ${ids[0]}` }))
    fireEvent.click(within(groups[1]).getByRole('button', { name: `Term ${ids[1]}` }))
    const wrong = within(groups[2]).getAllByRole('button').find(b => b.textContent !== `Term ${ids[2]}`)!
    fireEvent.click(wrong)
    expect(screen.getByText('3 of 3 answered')).toBeTruthy()

    fireEvent.click(button('Submit test'))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByText('67%')).toBeTruthy()
    expect(screen.getByText('2 correct')).toBeTruthy()
    expect(screen.getByText('1 incorrect')).toBeTruthy()
    expect(screen.getByText(/^Time: \d+:\d\d$/)).toBeTruthy()

    const nav = screen.getByRole('navigation', { name: 'Questions' })
    expect(within(nav).getByLabelText('Question 1, correct')).toBeTruthy()
    expect(within(nav).getByLabelText('Question 3, incorrect').getAttribute('href')).toBe('#q3')

    const reviewed = document.getElementById('q3')!
    expect(reviewed.textContent).toContain(`Definition ${ids[2]}`)
    expect(reviewed.textContent).toContain(`Your answer: ${wrong.textContent}`)
    expect(reviewed.textContent).toContain(`Correct answer: Term ${ids[2]}`)
    expect(document.getElementById('q1')!.textContent).not.toContain('Correct answer:')

    // The test counts towards the deck's progress.
    expect(saved().mastered.sort()).toEqual([ids[0], ids[1]].sort())
    expect(saved().missed).toEqual([ids[2]])
  })

  it('submits anyway with skipped questions, marking them wrong', () => {
    renderTest()
    setCount(2)
    fireEvent.click(button('Start test'))
    fireEvent.click(button('Submit test'))
    fireEvent.click(button('Submit anyway'))
    expect(screen.getByText('0%')).toBeTruthy()
    expect(screen.getAllByText('(skipped)')).toHaveLength(2)
  })

  it('grades written and true/false answers', () => {
    renderTest()
    toggle('Multiple choice')
    toggle('Written')
    setCount(2)
    fireEvent.click(button('Start test'))
    const inputs = [1, 2].map(n => screen.getByLabelText(`Question ${n}`) as HTMLInputElement)
    const ids = inputs.map(input => idIn(input.closest('div[class]')!.parentElement as HTMLElement))
    fireEvent.change(inputs[0], { target: { value: `term ${ids[0]}` } })
    fireEvent.change(inputs[1], { target: { value: 'wrong' } })
    fireEvent.click(button('Submit test'))
    expect(screen.getByText('50%')).toBeTruthy()
  })

  it('takes a new test with the same settings', () => {
    renderTest()
    toggle('Written')
    setCount(2)
    fireEvent.click(button('Start test'))
    fireEvent.click(button('Submit test'))
    fireEvent.click(button('Submit anyway'))
    fireEvent.click(button('Take a new test'))
    expect(screen.getByText('Set up your test')).toBeTruthy()
    expect(button('Written').getAttribute('aria-pressed')).toBe('true')
    expect((screen.getByLabelText('Number of questions') as HTMLInputElement).value).toBe('2')
  })
})
