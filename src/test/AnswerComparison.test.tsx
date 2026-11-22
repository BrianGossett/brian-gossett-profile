import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChakraProvider } from '@chakra-ui/react'
import { system } from '../Theme'
import AnswerComparison from '../Pages/ExamPrepPage/shared/AnswerComparison'

const show = (props: Parameters<typeof AnswerComparison>[0]) =>
  render(<ChakraProvider value={system}><AnswerComparison {...props} /></ChakraProvider>)

describe('AnswerComparison', () => {
  it('shows the model answer beside the user\'s answer when there is one', () => {
    show({ answer: 'Bach, Baroque', modelAnswer: 'J.S. Bach, Baroque, c. 1721' })
    expect(screen.getByText('YOUR ANSWER')).toBeTruthy()
    expect(screen.getByText('Bach, Baroque')).toBeTruthy()
    expect(screen.getByText('MODEL ANSWER')).toBeTruthy()
    expect(screen.getByText('J.S. Bach, Baroque, c. 1721')).toBeTruthy()
  })

  it.each([undefined, ''])('shows no model-answer box when the model answer is %j', modelAnswer => {
    const { container } = show({ answer: 'My answer', modelAnswer })
    expect(screen.queryByText('MODEL ANSWER')).toBeNull()
    // The user's answer is the only box, so it takes the full width.
    expect(container.firstElementChild!.children).toHaveLength(1)
    expect(screen.getByText('My answer')).toBeTruthy()
  })

  it('says so when the user left the answer blank', () => {
    show({ answer: '', modelAnswer: 'Model' })
    expect(screen.getByText('(no answer)')).toBeTruthy()
  })
})
