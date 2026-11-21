import type { Term } from '../data/terms'

export interface EditedTerm {
  /** The term's ID before editing, or undefined for a term added in this edit. */
  termId?: number
  term: string
  definition: string
  category: string
}

/**
 * Gives edited terms their IDs. Existing terms keep theirs, so study progress
 * (which is stored by term ID) stays attached to the right term when others are
 * added, removed or reordered. New terms get IDs above every ID the deck has
 * used, so a new term never inherits a removed term's progress.
 */
export function assignTermIds(rows: EditedTerm[], previousIds: number[] = []): Term[] {
  const seen = new Set<number>()
  let next = Math.max(0, ...previousIds, ...rows.map(r => r.termId ?? 0)) + 1
  return rows.map(r => {
    const keep = r.termId !== undefined && !seen.has(r.termId)
    const id = keep ? r.termId! : next++
    seen.add(id)
    return { id, term: r.term, definition: r.definition, category: r.category }
  })
}
