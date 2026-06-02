import { useState, useCallback } from "react"

const SESSION_KEY = "music-theory-study-session"

interface StudySession {
  mastered: number[]
  missed: number[]
  missedCounts: Record<number, number>
  streak: number
  lastMode: string
  lastCategory: string
  lastDeckId: string
  termCounts: { quiz: number; type: number; match: number }
  positions: {
    flashcards: number
    quiz: number
    type: number
    match: number
  }
}

const DEFAULT_SESSION: StudySession = {
  mastered: [],
  missed: [],
  missedCounts: {},
  streak: 0,
  lastMode: "flashcards",
  lastCategory: "all",
  lastDeckId: "default",
  termCounts: { quiz: 20, type: 20, match: 20 },
  positions: { flashcards: 0, quiz: 0, type: 0, match: 0 },
}

function load(): StudySession {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return { ...DEFAULT_SESSION }
    return { ...DEFAULT_SESSION, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SESSION }
  }
}

function save(session: StudySession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function useStudySession() {
  const [session, setSession] = useState<StudySession>(load)

  const update = useCallback((patch: Partial<StudySession>) => {
    setSession(prev => {
      const next = { ...prev, ...patch }
      save(next)
      return next
    })
  }, [])

  const markMastered = useCallback((id: number) => {
    setSession(prev => {
      const mastered = prev.mastered.includes(id) ? prev.mastered : [...prev.mastered, id]
      const missed = prev.missed.filter(x => x !== id)
      const next = { ...prev, mastered, missed, streak: prev.streak + 1 }
      save(next)
      return next
    })
  }, [])

  const markMissed = useCallback((id: number) => {
    setSession(prev => {
      const missed = prev.missed.includes(id) ? prev.missed : [...prev.missed, id]
      const missedCounts = { ...prev.missedCounts, [id]: (prev.missedCounts[id] ?? 0) + 1 }
      const next = { ...prev, missed, missedCounts, streak: 0 }
      save(next)
      return next
    })
  }, [])

  const setPosition = useCallback((mode: keyof StudySession["positions"], index: number) => {
    setSession(prev => {
      const next = { ...prev, positions: { ...prev.positions, [mode]: index } }
      save(next)
      return next
    })
  }, [])

  const setLastMode = useCallback((mode: string) => {
    update({ lastMode: mode })
  }, [update])

  const setLastCategory = useCallback((category: string) => {
    update({ lastCategory: category })
  }, [update])

  const setLastDeckId = useCallback((deckId: string) => {
    update({ lastDeckId: deckId })
  }, [update])

  const setTermCount = useCallback((mode: 'quiz' | 'type' | 'match', count: number) => {
    setSession(prev => {
      const next = { ...prev, termCounts: { ...prev.termCounts, [mode]: count } }
      save(next)
      return next
    })
  }, [])

  const resetSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setSession({ ...DEFAULT_SESSION })
  }, [])

  const weakTerms = Object.entries(session.missedCounts)
    .filter(([, count]) => count >= 2)
    .map(([id]) => Number(id))

  return {
    session,
    weakTerms,
    markMastered,
    markMissed,
    setPosition,
    setLastMode,
    setLastCategory,
    setLastDeckId,
    setTermCount,
    resetSession,
  }
}
