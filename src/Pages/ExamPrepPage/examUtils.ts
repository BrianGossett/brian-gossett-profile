import { type Term } from '../../data/terms'

export type DrillQuestionType = 'extended-pool' | 'fill-blank' | 'category-id'

export interface DrillQuestion {
  type: DrillQuestionType
  term: Term
  options?: Term[]         // extended-pool: correct + 5 distractors, shuffled
  blankedDef?: string      // fill-blank
  allCategories?: string[] // category-id
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function selectTermsForExam(
  terms: Term[],
  count: number,
  minCategories: number,
): Term[] {
  const byCategory: Record<string, Term[]> = {}
  for (const t of terms) {
    byCategory[t.category] = [...(byCategory[t.category] ?? []), t]
  }
  const categories = shuffle(Object.keys(byCategory))
  const used = new Set<number>()
  const result: Term[] = []

  for (const cat of categories.slice(0, minCategories)) {
    const pool = byCategory[cat]
    const pick = pool[Math.floor(Math.random() * pool.length)]
    if (pick && !used.has(pick.id)) {
      result.push(pick)
      used.add(pick.id)
    }
  }

  const remaining = shuffle(terms.filter(t => !used.has(t.id)))
  for (const t of remaining) {
    if (result.length >= count) break
    result.push(t)
  }

  return shuffle(result.slice(0, count))
}

export function getDistractors6(correct: Term, pool: Term[]): Term[] {
  const sameCategory = pool.filter(t => t.id !== correct.id && t.category === correct.category)
  const otherCategory = pool.filter(t => t.id !== correct.id && t.category !== correct.category)
  return shuffle([...sameCategory, ...otherCategory]).slice(0, 5)
}

export function canFillInBlank(term: Term): boolean {
  return term.definition.toLowerCase().includes(term.term.toLowerCase())
}

export function fillInBlank(term: Term): string {
  const escaped = term.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return term.definition.replace(new RegExp(escaped, 'gi'), '_____')
}

export function gradeFillBlank(userAnswer: string, term: Term): boolean {
  return userAnswer.trim().toLowerCase() === term.term.trim().toLowerCase()
}

export function buildDrillQuestions(
  terms: Term[],
  count: number,
  allCategories: string[],
): DrillQuestion[] {
  const pool = shuffle(terms).slice(0, count)
  return pool.map(term => {
    const fillable = canFillInBlank(term)
    const types: DrillQuestionType[] = fillable
      ? ['extended-pool', 'fill-blank', 'category-id']
      : ['extended-pool', 'category-id']
    const type = types[Math.floor(Math.random() * types.length)]

    if (type === 'extended-pool') {
      return { type, term, options: shuffle([term, ...getDistractors6(term, terms)]) }
    }
    if (type === 'fill-blank') {
      return { type, term, blankedDef: fillInBlank(term) }
    }
    return { type, term, allCategories }
  })
}
