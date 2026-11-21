import { describe, it, expect } from 'vitest'
import { assignTermIds } from '../utils/termIds'

const row = (term: string, termId?: number) => ({ termId, term, definition: `${term} def`, category: 'General' })

describe('assignTermIds', () => {
  it('numbers a new deck 1, 2, 3', () => {
    expect(assignTermIds([row('a'), row('b'), row('c')]).map(t => t.id)).toEqual([1, 2, 3])
  })

  it('keeps existing IDs when nothing structural changes', () => {
    expect(assignTermIds([row('a', 1), row('b', 2)], [1, 2]).map(t => t.id)).toEqual([1, 2])
  })

  it('keeps the remaining terms\' IDs when one is removed', () => {
    const terms = assignTermIds([row('a', 1), row('c', 3)], [1, 2, 3])
    expect(terms.map(t => [t.term, t.id])).toEqual([['a', 1], ['c', 3]])
  })

  it('keeps IDs with their terms when the order changes', () => {
    const terms = assignTermIds([row('c', 3), row('a', 1), row('b', 2)], [1, 2, 3])
    expect(terms.map(t => [t.term, t.id])).toEqual([['c', 3], ['a', 1], ['b', 2]])
  })

  it('gives an added term a new ID, wherever it is inserted', () => {
    const terms = assignTermIds([row('a', 1), row('new'), row('b', 2)], [1, 2])
    expect(terms.map(t => [t.term, t.id])).toEqual([['a', 1], ['new', 3], ['b', 2]])
  })

  it('never reuses the ID of a term removed in the same edit', () => {
    // Term 3 was removed and a new term added: the new one must not become 3.
    const terms = assignTermIds([row('a', 1), row('b', 2), row('new')], [1, 2, 3])
    expect(terms.map(t => t.id)).toEqual([1, 2, 4])
  })

  it('keeps the edited text with the kept ID', () => {
    const [term] = assignTermIds([{ termId: 7, term: 'renamed', definition: 'new def', category: 'Scales' }], [7])
    expect(term).toEqual({ id: 7, term: 'renamed', definition: 'new def', category: 'Scales' })
  })

  it('repairs duplicate IDs by renumbering the later one', () => {
    expect(assignTermIds([row('a', 1), row('b', 1)], [1]).map(t => t.id)).toEqual([1, 2])
  })
})
