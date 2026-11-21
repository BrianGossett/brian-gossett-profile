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
  return [...shuffle(same, random), ...shuffle(other, random)].slice(0, count)
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "").trim()
}

/** Whether a typed answer names the term. Ignores case, spaces and punctuation. */
export function isMatch(input: string, term: Term): boolean {
  const n = normalize(input)
  const t = normalize(term.term)
  if (n === t) return true
  const core = normalize(term.term.split(" ")[0])
  if (core.length >= 5 && n.includes(core)) return true
  return false
}
