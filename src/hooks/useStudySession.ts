import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { useParams } from "react-router"
import { EMPTY_PROGRESS, readProgress, subscribeProgress, writeProgress, type DeckProgress } from "./progressStore"
import { progressSync, type ProgressStatus } from "./progressSync"

const SESSION_KEY = "music-theory-study-session"

/** App-wide choices, the same for every deck. They last for the browser tab. */
interface Preferences {
  lastMode: string
  lastCategory: string
  lastDeckId: string
  termCounts: { quiz: number; type: number; match: number }
}

/** Preferences plus the current deck's progress, in the shape the study pages have always used. */
type StudySession = Preferences & DeckProgress

const DEFAULT_PREFERENCES: Preferences = {
  lastMode: "flashcards",
  lastCategory: "all",
  lastDeckId: "default",
  termCounts: { quiz: 20, type: 20, match: 20 },
}

function loadPreferences(): Preferences {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return { ...DEFAULT_PREFERENCES }
    const saved = JSON.parse(raw) as Partial<Preferences>
    return {
      lastMode: saved.lastMode ?? DEFAULT_PREFERENCES.lastMode,
      lastCategory: saved.lastCategory ?? DEFAULT_PREFERENCES.lastCategory,
      lastDeckId: saved.lastDeckId ?? DEFAULT_PREFERENCES.lastDeckId,
      termCounts: { ...DEFAULT_PREFERENCES.termCounts, ...saved.termCounts },
    }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

function savePreferences(preferences: Preferences): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(preferences))
}

/**
 * Study progress and preferences. Progress belongs to one deck: the deck in the
 * URL on a study-mode page, otherwise the deck last selected. It is kept in this
 * browser and, when signed in, saved to the account.
 */
export function useStudySession() {
  const params = useParams<{ deckId?: string }>()
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences)
  const deckId = params.deckId ?? preferences.lastDeckId

  const getProgress = useCallback(() => readProgress(deckId), [deckId])
  const progress = useSyncExternalStore(subscribeProgress, getProgress)

  useEffect(() => {
    progressSync.open(deckId)
    return () => progressSync.close(deckId)
  }, [deckId])

  const updatePreferences = useCallback((patch: Partial<Preferences>) => {
    setPreferences(prev => {
      const next = { ...prev, ...patch }
      savePreferences(next)
      return next
    })
  }, [])

  const updateProgress = useCallback((change: (prev: DeckProgress) => DeckProgress) => {
    writeProgress(deckId, change(readProgress(deckId)))
    progressSync.changed(deckId)
  }, [deckId])

  const markMastered = useCallback((id: number) => {
    updateProgress(prev => ({
      ...prev,
      mastered: prev.mastered.includes(id) ? prev.mastered : [...prev.mastered, id],
      missed: prev.missed.filter(x => x !== id),
      streak: prev.streak + 1,
    }))
  }, [updateProgress])

  const markMissed = useCallback((id: number) => {
    updateProgress(prev => ({
      ...prev,
      missed: prev.missed.includes(id) ? prev.missed : [...prev.missed, id],
      missedCounts: { ...prev.missedCounts, [id]: (prev.missedCounts[id] ?? 0) + 1 },
      streak: 0,
    }))
  }, [updateProgress])

  const setPosition = useCallback((mode: keyof DeckProgress["positions"], index: number) => {
    updateProgress(prev => ({ ...prev, positions: { ...prev.positions, [mode]: index } }))
  }, [updateProgress])

  const setLastMode = useCallback((mode: string) => {
    updatePreferences({ lastMode: mode })
  }, [updatePreferences])

  const setLastCategory = useCallback((category: string) => {
    updatePreferences({ lastCategory: category })
  }, [updatePreferences])

  const setLastDeckId = useCallback((id: string) => {
    updatePreferences({ lastDeckId: id })
  }, [updatePreferences])

  const setTermCount = useCallback((mode: 'quiz' | 'type' | 'match', count: number) => {
    setPreferences(prev => {
      const next = { ...prev, termCounts: { ...prev.termCounts, [mode]: count } }
      savePreferences(next)
      return next
    })
  }, [])

  /** Clears the current deck's progress. Preferences are kept. */
  const resetSession = useCallback(() => {
    updateProgress(() => ({ ...EMPTY_PROGRESS }))
  }, [updateProgress])

  const session: StudySession = useMemo(() => ({ ...preferences, ...progress }), [preferences, progress])

  const weakTerms = useMemo(
    () => Object.entries(progress.missedCounts).filter(([, count]) => count >= 2).map(([id]) => Number(id)),
    [progress.missedCounts],
  )

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

/** Where loading a deck's saved progress from the account has got to. 'idle' when signed out. */
export function useProgressStatus(deckId: string): ProgressStatus {
  const getStatus = useCallback(() => progressSync.getStatus(deckId), [deckId])
  return useSyncExternalStore(progressSync.subscribe, getStatus)
}
