import type { Term } from '../data/terms'
import { getDistractors, shuffle, type Random } from './studyQuestions'

/**
 * Learn mode: a deck is worked through in short rounds, and a term counts as
 * learned once it has been answered correctly twice: first as multiple choice,
 * then as a typed answer. Getting the typed answer wrong sends it back to
 * multiple choice.
 */
export const ROUND_SIZE = 7
/** Correct answers needed to learn a term. */
export const LEARNED = 2

/** Correct answers so far for each term ID. Missing means none. */
export type Stages = Record<number, number>

export type QuestionKind = 'choice' | 'typed'

export interface LearnQuestion {
  term: Term
  kind: QuestionKind
  /** The options for a multiple-choice question, in display order. Empty for typed. */
  options: Term[]
  /** True when the user got this wrong earlier in the round and is being asked again. */
  retry: boolean
}

export interface Round {
  /** The terms this round covers, for the recap. */
  terms: Term[]
  /** How many times each term was answered wrong in this round, by term ID. */
  misses: Record<number, number>
  /** Questions still to ask, including repeats added after wrong answers. */
  queue: LearnQuestion[]
  /** Index of the current question in `queue`. Equal to `queue.length` when the round is over. */
  index: number
}

export const stageOf = (stages: Stages, termId: number) => Math.min(LEARNED, Math.max(0, stages[termId] ?? 0))
export const isLearned = (stages: Stages, termId: number) => stageOf(stages, termId) >= LEARNED

/** Overall progress: correct answers so far out of the two each term needs. */
export function learnProgress(terms: readonly Term[], stages: Stages): { correct: number; total: number } {
  return {
    correct: terms.reduce((sum, t) => sum + stageOf(stages, t.id), 0),
    total: terms.length * LEARNED,
  }
}

export const isComplete = (terms: readonly Term[], stages: Stages) =>
  terms.length > 0 && terms.every(t => isLearned(stages, t.id))

/** A term's first question is multiple choice; its second is typed. */
export const kindFor = (stage: number): QuestionKind => (stage >= 1 ? 'typed' : 'choice')

function makeQuestion(term: Term, stage: number, pool: readonly Term[], retry: boolean, random: Random): LearnQuestion {
  const kind = kindFor(stage)
  return {
    term,
    kind,
    options: kind === 'choice' ? shuffle([term, ...getDistractors(term, pool, 3, random)], random) : [],
    retry,
  }
}

/**
 * The next round: the first terms not yet learned, in deck order. Returns null
 * when there is nothing left to learn.
 *
 * `pool` is where wrong options come from (the whole deck, so a small category
 * still gets plausible choices).
 */
export function createRound(terms: readonly Term[], stages: Stages, pool: readonly Term[], random: Random = Math.random): Round | null {
  const next = terms.filter(t => !isLearned(stages, t.id)).slice(0, ROUND_SIZE)
  if (next.length === 0) return null
  return {
    terms: next,
    misses: {},
    queue: shuffle(next, random).map(t => makeQuestion(t, stageOf(stages, t.id), pool, false, random)),
    index: 0,
  }
}

/** How many terms are at each stage: not started, one correct answer, or learned. */
export function buckets(terms: readonly Term[], stages: Stages): { unstarted: number; familiar: number; mastered: number } {
  const counts = { unstarted: 0, familiar: 0, mastered: 0 }
  for (const t of terms) {
    const stage = stageOf(stages, t.id)
    if (stage >= LEARNED) counts.mastered++
    else if (stage === 1) counts.familiar++
    else counts.unstarted++
  }
  return counts
}

export const SESSION_SIZES = [10, 20] as const
export type SessionSize = number | 'all'

/** The terms a session covers: the first `size` not yet learned, in deck order. */
export function selectSession(terms: readonly Term[], stages: Stages, size: SessionSize): Term[] {
  const open = terms.filter(t => !isLearned(stages, t.id))
  return size === 'all' ? open : open.slice(0, Math.max(0, size))
}

/** The terms missed most, most-missed first. Terms never missed are left out. */
export function trickiest(terms: readonly Term[], misses: Record<number, number>, limit = 8): { term: Term; misses: number }[] {
  return terms
    .map(term => ({ term, misses: misses[term.id] ?? 0 }))
    .filter(entry => entry.misses > 0)
    .sort((a, b) => b.misses - a.misses)
    .slice(0, limit)
}

export const currentQuestion = (round: Round): LearnQuestion | null => round.queue[round.index] ?? null
export const isRoundOver = (round: Round) => round.index >= round.queue.length

/**
 * Records the answer to the current question.
 *
 * Correct: the term moves one step towards learned.
 *
 * Wrong: the question is asked again at the end of the round. A wrong multiple
 * choice leaves the term where it is. A wrong typed answer sends the term back
 * to the start, so it has to pass multiple choice again before it is typed again.
 */
export function answer(
  round: Round,
  stages: Stages,
  correct: boolean,
  pool: readonly Term[],
  random: Random = Math.random,
): { round: Round; stages: Stages } {
  const question = currentQuestion(round)
  if (!question) return { round, stages }
  const { term } = question
  if (correct) {
    return {
      round: { ...round, index: round.index + 1 },
      stages: { ...stages, [term.id]: Math.min(LEARNED, stageOf(stages, term.id) + 1) },
    }
  }
  const nextStage = question.kind === 'typed' ? 0 : stageOf(stages, term.id)
  return {
    round: {
      ...round,
      misses: { ...round.misses, [term.id]: (round.misses[term.id] ?? 0) + 1 },
      queue: [...round.queue, makeQuestion(term, nextStage, pool, true, random)],
      index: round.index + 1,
    },
    stages: nextStage === stageOf(stages, term.id) ? stages : { ...stages, [term.id]: nextStage },
  }
}
