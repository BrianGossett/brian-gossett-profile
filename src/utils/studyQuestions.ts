import type { Term } from '../data/terms'

/** A source of random numbers in [0, 1). Tests pass their own to get a fixed order. */
export type Random = () => number

export function shuffle<T>(arr: readonly T[], random: Random = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Wrong options for a multiple-choice question, preferring terms from the same category. */
export function getDistractors(correct: Term, pool: readonly Term[], count = 3, random: Random = Math.random): Term[] {
  const same = pool.filter(t => t.id !== correct.id && t.category === correct.category)
  const other = pool.filter(t => t.id !== correct.id && t.category !== correct.category)
  // Many cards can share an answer ("Spirit"); never offer the correct answer or any answer twice.
  const seen = new Set([answerKey(correct)])
  const distractors: Term[] = []
  const take = (candidates: Term[]) => {
    for (const candidate of candidates) {
      if (distractors.length === count) return
      const key = answerKey(candidate)
      if (seen.has(key)) continue
      seen.add(key)
      distractors.push(candidate)
    }
  }
  take(shuffle(same, random))
  // A category with only a few possible answers (three item categories, say) is better
  // asked with fewer options than padded with an answer that plainly doesn't belong.
  if (distractors.length < 2) take(shuffle(other, random))
  return distractors
}

/** Two terms with the same key are the same answer, however they are capitalised or punctuated. */
export const answerKey = (term: Term) => normalize(term.term)

export function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "").trim()
}

/** How many single-character edits turn `a` into `b`. */
function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const above = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1))
      diagonal = above
    }
  }
  return row[b.length]
}

/** The items of an answer that is a comma-separated list, or null if it isn't one. */
export function listItems(answer: string): string[] | null {
  if (!answer.includes(",")) return null
  const items = splitList(answer).map(normalize).filter(Boolean)
  return items.length > 1 ? items : null
}

/** Splits a list on commas, semicolons, slashes, "&" and the word "and". */
const splitList = (text: string) => text.split(/[,;/&]+|\band\b/i)

/**
 * Checks a typed answer against a list answer: every item, nothing extra, in
 * any order. A one-letter typo in an item of four or more letters is forgiven.
 */
function isListMatch(input: string, answer: string, expected: string[]): boolean {
  // Split on commas; if every expected item is one word, spaces separate items too.
  const oneWordItems = splitList(answer).every(item => !/\s/.test(item.trim()))
  const typed = (oneWordItems ? splitList(input).flatMap(part => part.split(/\s+/)) : splitList(input))
    .map(normalize)
    .filter(Boolean)
  const remaining = [...expected]
  for (const word of typed) {
    let index = remaining.indexOf(word)
    if (index === -1) index = remaining.findIndex(item => item.length >= 4 && editDistance(word, item) === 1)
    if (index === -1) return false // not on the list, or given twice
    remaining.splice(index, 1)
  }
  return remaining.length === 0
}

/**
 * Whether a typed answer names the term. Ignores case, spaces and punctuation.
 * When the term is a comma-separated list, the answer must contain exactly its
 * items, in any order.
 */
export function isMatch(input: string, term: Term): boolean {
  const items = listItems(term.term)
  if (items) return isListMatch(input, term.term, items)
  const n = normalize(input)
  const t = normalize(term.term)
  if (n === t) return true
  const core = normalize(term.term.split(" ")[0])
  if (core.length >= 5 && n.includes(core)) return true
  return false
}
