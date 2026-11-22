import { ApiError } from '../api/client'
import type { Deck } from '../hooks/deckStore'

type Failure = null | 'network' | 'server' | 'rejected'

/** An in-memory stand-in for the deck routes of the API, with switchable failures. */
export function createFakeDeckApi() {
  const server = new Map<string, Deck>()
  const calls: string[] = []
  const state = { fail: null as Failure, failOnly: null as RegExp | null }

  async function api<T = unknown>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
    const method = options.method ?? 'GET'
    const call = `${method} ${path}`
    calls.push(call)
    if (state.fail && (!state.failOnly || state.failOnly.test(call))) {
      if (state.fail === 'network') throw new TypeError('Failed to fetch')
      if (state.fail === 'server') throw new ApiError(503, 'Service unavailable')
      throw new ApiError(413, 'deck is too large to store')
    }
    const id = decodeURIComponent(path.split('/')[2] ?? '')
    if (call === 'GET /decks') return { decks: [...server.values()] } as T
    if (call === 'POST /flashcards/import') {
      const imported: string[] = []
      const skipped: string[] = []
      for (const deck of (options.body as { decks: Deck[] }).decks) {
        if (server.has(deck.id)) skipped.push(deck.id)
        else { server.set(deck.id, deck); imported.push(deck.id) }
      }
      return { imported, skipped } as T
    }
    if (method === 'PUT' && path.startsWith('/decks/')) {
      const deck = { id, ...(options.body as Omit<Deck, 'id'>) }
      server.set(id, deck)
      return deck as T
    }
    if (method === 'DELETE' && path.startsWith('/decks/')) {
      server.delete(id)
      return undefined as T
    }
    throw new ApiError(404, `No route for ${call}`)
  }

  return {
    api,
    server,
    calls,
    /** Makes matching requests fail until `succeed()` is called. */
    failWith: (fail: Exclude<Failure, null>, only: RegExp | null = null) => { state.fail = fail; state.failOnly = only },
    succeed: () => { state.fail = null; state.failOnly = null },
    reset: () => { server.clear(); calls.length = 0; state.fail = null; state.failOnly = null },
  }
}
