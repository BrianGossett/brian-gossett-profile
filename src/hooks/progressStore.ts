/**
 * Study progress for each deck, kept in this browser. For signed-in users it is
 * also the working copy and offline cache of the progress saved to their account.
 */
export interface DeckProgress {
  mastered: number[]
  missed: number[]
  missedCounts: Record<number, number>
  /** Correct answers in a row. */
  streak: number
  positions: { flashcards: number; quiz: number; type: number; match: number }
  /** Learn mode: correct answers so far (0 to 2) for each term ID. */
  learn: Record<number, number>
  /** Terms the user has starred, to study on their own. */
  starred: number[]
  /** Which side flashcards show first, if the user has chosen. Otherwise the deck decides. */
  flashcardFront?: 'term' | 'definition'
  /** Matching: the best round time in seconds, for each number of pairs in a round. */
  bestMatch: Record<number, number>
}

export const PROGRESS_KEY = 'study-deck-progress'

export const EMPTY_PROGRESS: DeckProgress = Object.freeze({
  mastered: [],
  missed: [],
  missedCounts: {},
  streak: 0,
  positions: { flashcards: 0, quiz: 0, type: 0, match: 0 },
  learn: {},
  starred: [],
  bestMatch: {},
}) as DeckProgress

type ProgressMap = Record<string, DeckProgress>

const NONE: ProgressMap = {}
const listeners = new Set<() => void>()
// Parsed progress is cached against the raw string so readers get the same objects until it changes.
let cached: { raw: string | null; all: ProgressMap } = { raw: null, all: NONE }

const numbers = (v: unknown): number[] => (Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number') : [])
const count = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0)

/** Fills in anything missing, so progress from an older version or the account is always complete. */
export function normalizeProgress(raw: unknown): DeckProgress {
  const p = (raw ?? {}) as Partial<DeckProgress>
  const positions = (p.positions ?? {}) as Partial<DeckProgress['positions']>
  const missedCounts: Record<number, number> = {}
  for (const [id, n] of Object.entries(p.missedCounts ?? {})) if (count(n) > 0) missedCounts[Number(id)] = count(n)
  const bestMatch: Record<number, number> = {}
  for (const [pairs, t] of Object.entries(p.bestMatch ?? {})) {
    if (typeof t === 'number' && Number.isFinite(t) && t > 0) bestMatch[Number(pairs)] = t
  }
  const learn: Record<number, number> = {}
  for (const [id, n] of Object.entries(p.learn ?? {})) if (count(n) > 0) learn[Number(id)] = Math.min(2, count(n))
  return {
    mastered: numbers(p.mastered),
    missed: numbers(p.missed),
    missedCounts,
    streak: count(p.streak),
    positions: {
      flashcards: count(positions.flashcards),
      quiz: count(positions.quiz),
      type: count(positions.type),
      match: count(positions.match),
    },
    learn,
    starred: [...new Set(numbers(p.starred))],
    bestMatch,
    ...(p.flashcardFront === 'term' || p.flashcardFront === 'definition' ? { flashcardFront: p.flashcardFront } : {}),
  }
}

export function readAllProgress(): ProgressMap {
  let raw: string | null
  try {
    raw = localStorage.getItem(PROGRESS_KEY)
  } catch {
    return NONE
  }
  if (raw === cached.raw) return cached.all
  let all = NONE
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      all = Object.fromEntries(Object.entries(parsed).map(([id, p]) => [id, normalizeProgress(p)]))
    }
  } catch {
    all = NONE
  }
  cached = { raw, all }
  return all
}

export const readProgress = (deckId: string): DeckProgress => readAllProgress()[deckId] ?? EMPTY_PROGRESS

export function writeAllProgress(all: ProgressMap): void {
  if (Object.keys(all).length === 0) localStorage.removeItem(PROGRESS_KEY)
  else localStorage.setItem(PROGRESS_KEY, JSON.stringify(all))
  listeners.forEach(l => l())
}

export function writeProgress(deckId: string, progress: DeckProgress): void {
  writeAllProgress({ ...readAllProgress(), [deckId]: progress })
}

export function removeProgress(deckId: string): void {
  const { [deckId]: _removed, ...rest } = readAllProgress()
  void _removed
  writeAllProgress(rest)
}

export function subscribeProgress(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => { if (e.key === PROGRESS_KEY || e.key === null) listener() }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/**
 * Combines progress made in two places without losing anything from either:
 * a term mastered or starred in one is mastered or starred, and miss counts and
 * Learn stages take the higher number.
 * Positions and the streak follow `preferred`.
 */
export function mergeProgress(other: DeckProgress, preferred: DeckProgress): DeckProgress {
  const mastered = [...new Set([...other.mastered, ...preferred.mastered])]
  const missedCounts: Record<number, number> = { ...other.missedCounts }
  for (const [id, n] of Object.entries(preferred.missedCounts)) {
    missedCounts[Number(id)] = Math.max(missedCounts[Number(id)] ?? 0, n)
  }
  const learn: Record<number, number> = { ...other.learn }
  for (const [id, n] of Object.entries(preferred.learn)) learn[Number(id)] = Math.max(learn[Number(id)] ?? 0, n)
  const bestMatch: Record<number, number> = { ...other.bestMatch }
  for (const [pairs, t] of Object.entries(preferred.bestMatch)) bestMatch[Number(pairs)] = Math.min(bestMatch[Number(pairs)] ?? Infinity, t)
  return {
    mastered,
    missed: [...new Set([...other.missed, ...preferred.missed])].filter(id => !mastered.includes(id)),
    missedCounts,
    streak: preferred.streak,
    positions: preferred.positions,
    learn,
    starred: [...new Set([...other.starred, ...preferred.starred])],
    bestMatch,
    ...(preferred.flashcardFront ?? other.flashcardFront ? { flashcardFront: preferred.flashcardFront ?? other.flashcardFront } : {}),
  }
}
