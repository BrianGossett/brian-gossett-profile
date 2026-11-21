import { ApiError, api as defaultApi } from '../api/client'
import { readDecks, writeDecks, type Deck } from './deckStore'

/**
 * Keeps the decks in this browser in step with the signed-in user's account.
 *
 * - Every change is made locally first and then sent to the API. Changes that
 *   could not be sent are remembered and retried, so working offline loses nothing.
 * - OWNER_KEY records whose account the local decks mirror. Decks with no owner
 *   were made while signed out; the next sign-in uploads them, keeping their IDs,
 *   and makes that user the owner. Because the import route skips IDs that already
 *   exist, repeating it can never create a duplicate.
 */
export const OWNER_KEY = 'study-decks-owner'
export const PENDING_KEY = 'study-decks-pending'

export type SyncStatus = 'idle' | 'loading' | 'ready' | 'error'

type Api = typeof defaultApi

interface Pending {
  /** Decks changed locally and not yet saved to the account. */
  puts: string[]
  /** Decks deleted locally and not yet deleted from the account. */
  deletes: string[]
  /** Decks the account refused (too large, for example). They stay in this browser only. */
  rejected: string[]
}

const emptyPending = (): Pending => ({ puts: [], deletes: [], rejected: [] })

function readPending(): Pending {
  try {
    const p = JSON.parse(localStorage.getItem(PENDING_KEY) ?? 'null') as Partial<Pending> | null
    return { puts: p?.puts ?? [], deletes: p?.deletes ?? [], rejected: p?.rejected ?? [] }
  } catch {
    return emptyPending()
  }
}

function writePending(p: Pending) {
  if (p.puts.length + p.deletes.length + p.rejected.length === 0) localStorage.removeItem(PENDING_KEY)
  else localStorage.setItem(PENDING_KEY, JSON.stringify(p))
}

const without = (list: string[], id: string) => list.filter(x => x !== id)
const withId = (list: string[], id: string) => (list.includes(id) ? list : [...list, id])

/** The account will never accept this request, so retrying is pointless. */
const isPermanent = (err: unknown) =>
  err instanceof ApiError && err.status >= 400 && err.status < 500 && ![401, 408, 429].includes(err.status)

export function createDeckSync(deps: { api?: Api } = {}) {
  const api = deps.api ?? defaultApi
  const listeners = new Set<() => void>()
  let userId: string | null = null
  let status: SyncStatus = 'idle'
  let imported = 0
  // Sign-in and sign-out can arrive in quick succession; each run checks it is still the latest.
  let run = 0

  const notify = () => listeners.forEach(l => l())
  const setStatus = (s: SyncStatus) => { status = s; notify() }

  /** Sends remembered changes. Returns false if any could not be sent yet. */
  async function flush(): Promise<boolean> {
    let allSent = true
    for (const id of readPending().puts) {
      const deck = readDecks().find(d => d.id === id)
      try {
        if (deck) await api(`/decks/${encodeURIComponent(id)}`, { method: 'PUT', body: { name: deck.name, terms: deck.terms } })
        writePending({ ...readPending(), puts: without(readPending().puts, id) })
      } catch (err) {
        if (isPermanent(err)) {
          const p = readPending()
          writePending({ ...p, puts: without(p.puts, id), rejected: withId(p.rejected, id) })
        } else allSent = false
      }
    }
    for (const id of readPending().deletes) {
      try {
        await api(`/decks/${encodeURIComponent(id)}`, { method: 'DELETE' })
        writePending({ ...readPending(), deletes: without(readPending().deletes, id) })
      } catch (err) {
        if (isPermanent(err)) writePending({ ...readPending(), deletes: without(readPending().deletes, id) })
        else allSent = false
      }
    }
    return allSent
  }

  let inFlight: { id: string; promise: Promise<void> } | null = null

  /** Called when a user is signed in: uploads signed-out decks once, then loads the account's decks. */
  function signedIn(id: string): Promise<void> {
    // React can run the sign-in effect twice in development; share one load per user.
    if (inFlight?.id === id) return inFlight.promise
    const promise = load(id).finally(() => { if (inFlight?.promise === promise) inFlight = null })
    inFlight = { id, promise }
    return promise
  }

  async function load(id: string): Promise<void> {
    const mine = ++run
    userId = id
    imported = 0
    setStatus('loading')
    try {
      const owner = localStorage.getItem(OWNER_KEY)
      if (owner && owner !== id) {
        // These decks mirror someone else's account. They are safe there; don't mix them in.
        writeDecks([])
        writePending(emptyPending())
        localStorage.removeItem(OWNER_KEY)
      }
      if (localStorage.getItem(OWNER_KEY) !== id) {
        const local = readDecks()
        if (local.length > 0) {
          const res = await api<{ imported: string[]; skipped: string[] }>('/flashcards/import', { method: 'POST', body: { decks: local } })
          if (mine !== run) return
          imported = res.imported.length
        }
        // Only now do the local decks belong to this account. If the import failed,
        // the line above threw and the next sign-in tries again.
        localStorage.setItem(OWNER_KEY, id)
      }

      await flush()
      const { decks } = await api<{ decks: Deck[] }>('/decks')
      if (mine !== run) return

      // The account is the source of truth, except for changes it hasn't received yet.
      const pending = readPending()
      const keepLocal = new Set([...pending.puts, ...pending.rejected])
      const local = readDecks()
      const merged = [
        ...decks.filter(d => !keepLocal.has(d.id) && !pending.deletes.includes(d.id)),
        ...local.filter(d => keepLocal.has(d.id)),
      ]
      writeDecks(merged)
      setStatus('ready')
    } catch {
      // Offline or the API failed: keep showing the decks already in this browser.
      if (mine === run) setStatus('error')
    }
  }

  /** Called when nobody is signed in. Removes an account's decks from this browser. */
  function signedOut(): void {
    run++
    inFlight = null
    userId = null
    imported = 0
    if (localStorage.getItem(OWNER_KEY)) {
      // Keep only decks with changes the account never received, so they aren't lost;
      // they become signed-out decks and are uploaded at the next sign-in.
      const unsent = new Set([...readPending().puts, ...readPending().rejected])
      writeDecks(readDecks().filter(d => unsent.has(d.id)))
      writePending(emptyPending())
      localStorage.removeItem(OWNER_KEY)
    }
    setStatus('idle')
  }

  /** Call after a deck is created or changed locally. Does nothing when signed out. */
  function put(deck: Deck): void {
    if (!userId) return
    const p = readPending()
    writePending({ puts: withId(p.puts, deck.id), deletes: without(p.deletes, deck.id), rejected: without(p.rejected, deck.id) })
    void flush()
  }

  /** Call after a deck is deleted locally. Does nothing when signed out. */
  function remove(id: string): void {
    if (!userId) return
    const p = readPending()
    writePending({ puts: without(p.puts, id), deletes: withId(p.deletes, id), rejected: without(p.rejected, id) })
    void flush()
  }

  return {
    signedIn,
    signedOut,
    put,
    remove,
    /** Sends any remembered changes now. Used when the browser comes back online. */
    retry: () => (userId ? flush() : Promise.resolve(true)),
    getStatus: () => status,
    /** How many signed-out decks the last sign-in uploaded. Reading it resets it. */
    takeImportedCount: () => { const n = imported; imported = 0; return n },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

export type DeckSync = ReturnType<typeof createDeckSync>

export const deckSync = createDeckSync()
