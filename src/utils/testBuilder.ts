import type { Term } from '../data/terms'
import { getDistractors, isMatch, normalize, shuffle, type Random } from './studyQuestions'

/**
 * Test mode: a one-page practice test with up to four kinds of question, graded
 * when the user submits it.
 */
export const QUESTION_TYPES = ['trueFalse', 'choice', 'matching', 'written'] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

export const TYPE_LABELS: Record<QuestionType, string> = {
  trueFalse: 'True / false',
  choice: 'Multiple choice',
  matching: 'Matching',
  written: 'Written',
}

export interface TestSettings {
  /** How many terms the test covers. */
  count: number
  /** Which side the user answers with. The other side is shown as the prompt. */
  answerWith: 'term' | 'definition'
  types: QuestionType[]
}

export type Question =
  /** A prompt paired with an answer that is either its own (true) or another term's (false). */
  | { type: 'trueFalse'; term: Term; shown: Term; isTrue: boolean }
  | { type: 'choice'; term: Term; options: Term[] }
  /** A small group to pair up. `choices` are the same terms in a different order. */
  | { type: 'matching'; terms: Term[]; choices: Term[] }
  | { type: 'written'; term: Term }

/** What the user entered for one question; undefined (or a missing entry) means skipped. */
export type Answer =
  | boolean // trueFalse
  | number // choice: the chosen term's ID
  | string // written
  | Record<number, number> // matching: term ID → chosen term ID

export const MATCHING_GROUP_SIZE = 5

export const promptOf = (term: Term, s: TestSettings) => (s.answerWith === 'term' ? term.definition : term.term)
export const answerOf = (term: Term, s: TestSettings) => (s.answerWith === 'term' ? term.term : term.definition)
const sameAnswer = (a: Term, b: Term, s: TestSettings) => normalize(answerOf(a, s)) === normalize(answerOf(b, s))

/** Shares `count` questions between the types as evenly as possible, earlier types first. */
export function distribute(count: number, types: readonly QuestionType[]): Record<QuestionType, number> {
  const ordered = QUESTION_TYPES.filter(t => types.includes(t))
  const share: Record<QuestionType, number> = { trueFalse: 0, choice: 0, matching: 0, written: 0 }
  if (ordered.length === 0) return share
  ordered.forEach((type, i) => {
    share[type] = Math.floor(count / ordered.length) + (i < count % ordered.length ? 1 : 0)
  })
  // One term can't be matched against anything: give it to another type, or take one from another.
  if (share.matching === 1) {
    const other = ordered.find(t => t !== 'matching')
    if (!other) return share
    const donor = ordered.find(t => t !== 'matching' && share[t] > 0)
    if (donor && count >= 2 && share[donor] >= 1 && ordered.length > 1 && share[donor] > 1) {
      share[donor] -= 1
      share.matching = 2
    } else {
      share.matching = 0
      share[other] += 1
    }
  }
  return share
}

/** Splits terms into matching groups of up to five, never leaving a group of one. */
function matchingGroups(terms: Term[]): Term[][] {
  const groups: Term[][] = []
  for (let i = 0; i < terms.length; i += MATCHING_GROUP_SIZE) groups.push(terms.slice(i, i + MATCHING_GROUP_SIZE))
  const last = groups[groups.length - 1]
  if (groups.length > 1 && last.length === 1) last.unshift(groups[groups.length - 2].pop()!)
  return groups
}

/**
 * Builds a test from `terms`, using each term at most once. Questions come out
 * grouped by type, in the order true/false, multiple choice, matching, written.
 * `pool` supplies wrong answers.
 */
export function buildTest(terms: readonly Term[], pool: readonly Term[], settings: TestSettings, random: Random = Math.random): Question[] {
  const count = Math.max(0, Math.min(settings.count, terms.length))
  const share = distribute(count, settings.types)
  const picked = shuffle(terms, random).slice(0, count)
  let next = 0
  const take = (n: number) => picked.slice(next, (next += n))
  const questions: Question[] = []

  // True/false: true about half the time. A false statement borrows a different answer.
  const tf = take(share.trueFalse)
  const truths = shuffle(tf.map((_, i) => i < Math.ceil(tf.length / 2)), random)
  tf.forEach((term, i) => {
    const others = pool.filter(t => t.id !== term.id && !sameAnswer(t, term, settings))
    const sameCategory = others.filter(t => t.category === term.category)
    const candidates = sameCategory.length > 0 ? sameCategory : others
    const isTrue = truths[i] || candidates.length === 0
    questions.push({ type: 'trueFalse', term, shown: isTrue ? term : candidates[Math.floor(random() * candidates.length)], isTrue })
  })

  for (const term of take(share.choice)) {
    const distractors = getDistractors(term, pool, 3, random).filter(d => !sameAnswer(d, term, settings))
    questions.push({ type: 'choice', term, options: shuffle([term, ...distractors], random) })
  }

  const matching = take(share.matching)
  if (matching.length > 0) {
    for (const group of matchingGroups(matching)) questions.push({ type: 'matching', terms: group, choices: shuffle(group, random) })
  }

  for (const term of take(share.written)) questions.push({ type: 'written', term })

  return questions
}

/** How many numbered questions a test has (each term in a matching group counts as one). */
export const questionCount = (questions: readonly Question[]) =>
  questions.reduce((n, q) => n + (q.type === 'matching' ? q.terms.length : 1), 0)

export interface GradedItem {
  /** 1-based question number. */
  number: number
  /** Index of the question it belongs to in the test. */
  questionIndex: number
  type: QuestionType
  term: Term
  prompt: string
  /** What the user answered, as text, or null if they skipped it. */
  given: string | null
  /** The right answer, as text. */
  expected: string
  correct: boolean
}

function isWrittenCorrect(input: string, term: Term, settings: TestSettings): boolean {
  if (settings.answerWith === 'term') return isMatch(input, term)
  return normalize(input) !== '' && normalize(input) === normalize(term.definition)
}

/** Grades every numbered question. A skipped question is wrong. */
export function grade(questions: readonly Question[], answers: Record<number, Answer | undefined>, settings: TestSettings): GradedItem[] {
  const items: GradedItem[] = []
  let number = 0
  questions.forEach((q, questionIndex) => {
    const answer = answers[questionIndex]
    if (q.type === 'trueFalse') {
      const given = typeof answer === 'boolean' ? answer : null
      items.push({
        number: ++number, questionIndex, type: q.type, term: q.term,
        prompt: `${promptOf(q.term, settings)} — ${answerOf(q.shown, settings)}`,
        given: given === null ? null : given ? 'True' : 'False',
        expected: q.isTrue ? 'True' : `False. It is: ${answerOf(q.term, settings)}`,
        correct: given === q.isTrue,
      })
    } else if (q.type === 'choice') {
      const chosen = typeof answer === 'number' ? q.options.find(o => o.id === answer) : undefined
      items.push({
        number: ++number, questionIndex, type: q.type, term: q.term,
        prompt: promptOf(q.term, settings),
        given: chosen ? answerOf(chosen, settings) : null,
        expected: answerOf(q.term, settings),
        correct: chosen !== undefined && sameAnswer(chosen, q.term, settings),
      })
    } else if (q.type === 'written') {
      const text = typeof answer === 'string' ? answer.trim() : ''
      items.push({
        number: ++number, questionIndex, type: q.type, term: q.term,
        prompt: promptOf(q.term, settings),
        given: text === '' ? null : text,
        expected: answerOf(q.term, settings),
        correct: text !== '' && isWrittenCorrect(text, q.term, settings),
      })
    } else {
      const picks = answer !== null && typeof answer === 'object' ? answer : {}
      for (const term of q.terms) {
        const chosen = q.choices.find(c => c.id === picks[term.id])
        items.push({
          number: ++number, questionIndex, type: q.type, term,
          prompt: promptOf(term, settings),
          given: chosen ? answerOf(chosen, settings) : null,
          expected: answerOf(term, settings),
          correct: chosen !== undefined && sameAnswer(chosen, term, settings),
        })
      }
    }
  })
  return items
}

/** How many numbered questions have no answer yet. */
export const skippedCount = (questions: readonly Question[], answers: Record<number, Answer | undefined>, settings: TestSettings) =>
  grade(questions, answers, settings).filter(item => item.given === null).length

export function score(items: readonly GradedItem[]): { correct: number; incorrect: number; percent: number } {
  const correct = items.filter(i => i.correct).length
  return { correct, incorrect: items.length - correct, percent: items.length === 0 ? 0 : Math.round((correct / items.length) * 100) }
}

/** `65` → "1:05". */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
