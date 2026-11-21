import { api as defaultApi } from '../api/client'
import {
  mergeProgress,
  normalizeProgress,
  readAllProgress,
  readProgress,
  writeAllProgress,
  writeProgress,
  type DeckProgress,
} from './progressStore'

/**
 * Saves each deck's study progress to the signed-in user's account.
 *
 * - Progress is always written to this browser first. Saves to the account are
 *   batched: a burst of answers becomes one request a moment later.
 * - A deck's saved progress is loaded once when the deck is opened. The account
 *   wins unless this browser has changes it hasn't sent yet.
 * - Progress made while signed out is merged into the account's at the next
 *   sign-in rather than replacing it.
 */
export const PROGRESS_OWNER_KEY = 'study-progress-owner'
export const PROGRESS_SYNC_KEY = 'study-progress-sync'

type Api = typeof defaultApi

export type ProgressStatus = 'idle' | 'loading' | 'ready' | 'error'

interface SyncState {
  /** Decks changed here and not yet saved to the account. */
  dirty: string[]
  /** Decks with progress from before sign-in, still to be merged with the account's. */
  merge: string[]
}

function readState(): SyncState {
  try {
    const s = JSON.parse(localStorage.getItem(PROGRESS_SYNC_KEY) ?? 'null') as Partial<SyncState> | null
    return { dirty: s?.dirty ?? [], merge: s?.merge ?? [] }
  } catch {
    return { dirty: [], merge: [] }
  }
}

function writeState(s: SyncState) {
  if (s.dirty.length + s.merge.length === 0) localStorage.removeItem(PROGRESS_SYNC_KEY)
  else localStorage.setItem(PROGRESS_SYNC_KEY, JSON.stringify(s))
}

const without = (list: string[], id: string) => list.filter(x => x !== id)
const withId = (list: string[], id: string) => (list.includes(id) ? list : [...list, id])

export const SAVE_DELAY_MS = 1500

export function createProgressSync(deps: { api?: Api; delayMs?: number } = {}) {
  const api = deps.api ?? defaultApi
  const delayMs = deps.delayMs ?? SAVE_DELAY_MS
  const listeners = new Set<() => void>()
  /** Decks a study page currently has open. */
  const open = new Set<string>()
  const status = new Map<string, ProgressStatus>()
  let userId: string | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let run = 0

  const notify = () => listeners.forEach(l => l())
  const setStatus = (deckId: string, s: ProgressStatus) => { status.set(deckId, s); notify() }
  const path = (deckId: string) => `/progress/${encodeURIComponent(deckId)}`

  async function push(deckId: string): Promise<boolean> {
    try {
      await api(path(deckId), { method: 'PUT', body: { progress: readProgress(deckId) } })
      writeState({ ...readState(), dirty: without(readState().dirty, deckId) })
      return true
    } catch {
      return false
    }
  }

  /** Saves every deck with unsent changes now. Returns false if any could not be saved. */
  async function flush(): Promise<boolean> {
    if (timer) { clearTimeout(timer); timer = null }
    if (!userId) return true
    let allSaved = true
    for (const deckId of readState().dirty) allSaved = (await push(deckId)) && allSaved
    return allSaved
  }

  async function load(deckId: string): Promise<void> {
    const mine = run
    setStatus(deckId, 'loading')
    try {
      const res = await api<{ progress: unknown }>(path(deckId))
      if (mine !== run) return
      const server = res.progress ? normalizeProgress(res.progress) : null
      const state = readState()
      if (state.merge.includes(deckId)) {
        // Progress from before sign-in: combine it with the account's and save the result.
        if (server) writeProgress(deckId, mergeProgress(server, readProgress(deckId)))
        writeState({ dirty: withId(state.dirty, deckId), merge: without(state.merge, deckId) })
        await push(deckId)
      } else if (state.dirty.includes(deckId)) {
        // This browser has newer changes than the account: send them.
        await push(deckId)
      } else if (server) {
        writeProgress(deckId, server)
      }
      if (mine === run) setStatus(deckId, 'ready')
    } catch {
      // Offline or the API failed: carry on with the progress in this browser.
      if (mine === run) setStatus(deckId, 'error')
    }
  }

  function signedIn(id: string): void {
    if (userId === id) return
    run++
    userId = id
    status.clear()
    const owner = localStorage.getItem(PROGRESS_OWNER_KEY)
    if (owner && owner !== id) {
      // This progress belongs to another account. It is safe there; don't mix it in.
      writeAllProgress({})
      writeState({ dirty: [], merge: [] })
    } else if (!owner) {
      // Progress made while signed out: merge each deck with the account when it is opened.
      writeState({ dirty: [], merge: Object.keys(readAllProgress()) })
    }
    localStorage.setItem(PROGRESS_OWNER_KEY, id)
    notify()
    for (const deckId of open) void load(deckId)
    void flush()
  }

  function signedOut(): void {
    run++
    if (timer) { clearTimeout(timer); timer = null }
    userId = null
    status.clear()
    if (localStorage.getItem(PROGRESS_OWNER_KEY)) {
      // Keep only progress the account never received; it is merged in at the next sign-in.
      const { dirty, merge } = readState()
      const unsent = new Set([...dirty, ...merge])
      writeAllProgress(Object.fromEntries(Object.entries(readAllProgress()).filter(([deckId]) => unsent.has(deckId))))
      writeState({ dirty: [], merge: [] })
      localStorage.removeItem(PROGRESS_OWNER_KEY)
    }
    notify()
  }

  return {
    signedIn,
    signedOut,
    flush,
    /** A study page opened this deck: load its saved progress if signed in. */
    open(deckId: string): void {
      open.add(deckId)
      if (userId && !status.has(deckId)) void load(deckId)
    },
    /** The study page closed the deck: save anything still waiting. */
    close(deckId: string): void {
      open.delete(deckId)
      if (userId && readState().dirty.includes(deckId)) void flush()
    },
    /** Progress for this deck changed locally. Saves are batched. Does nothing when signed out. */
    changed(deckId: string): void {
      if (!userId) return
      writeState({ ...readState(), dirty: withId(readState().dirty, deckId) })
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => { timer = null; void flush() }, delayMs)
    },
    /** A deck was deleted: forget anything waiting to be saved for it. */
    forget(deckId: string): void {
      const s = readState()
      writeState({ dirty: without(s.dirty, deckId), merge: without(s.merge, deckId) })
      status.delete(deckId)
    },
    /** 'idle' when signed out, or when this deck's saved progress hasn't been asked for yet. */
    getStatus: (deckId: string): ProgressStatus => (userId ? status.get(deckId) ?? 'idle' : 'idle'),
    isSignedIn: () => userId !== null,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

export type ProgressSync = ReturnType<typeof createProgressSync>
export type { DeckProgress }

export const progressSync = createProgressSync()
