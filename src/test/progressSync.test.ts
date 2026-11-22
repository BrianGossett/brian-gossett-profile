import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ApiError } from '../api/client'
import {
  EMPTY_PROGRESS,
  mergeProgress,
  normalizeProgress,
  readAllProgress,
  readProgress,
  writeProgress,
  type DeckProgress,
} from '../hooks/progressStore'
import { PROGRESS_OWNER_KEY, PROGRESS_SYNC_KEY, createProgressSync } from '../hooks/progressSync'

const progress = (patch: Partial<DeckProgress> = {}): DeckProgress => ({ ...EMPTY_PROGRESS, ...patch })

/** An in-memory stand-in for the /progress routes. */
function fakeApi() {
  const server = new Map<string, DeckProgress>()
  const calls: string[] = []
  const state = { fail: false }
  async function api<T = unknown>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
    const method = options.method ?? 'GET'
    calls.push(`${method} ${path}`)
    if (state.fail) throw new ApiError(503, 'down')
    const deckId = decodeURIComponent(path.split('/')[2])
    if (method === 'PUT') {
      server.set(deckId, (options.body as { progress: DeckProgress }).progress)
      return { deckId } as T
    }
    return { deckId, progress: server.get(deckId) ?? null } as T
  }
  return { api, server, calls, state }
}

const setup = () => {
  const fake = fakeApi()
  return { fake, sync: createProgressSync({ api: fake.api as never, delayMs: 1500 }) }
}
const settle = async () => { await vi.advanceTimersByTimeAsync(0) }

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

describe('progress helpers', () => {
  it('fills in anything missing', () => {
    expect(normalizeProgress({ mastered: [1, 'x', 2] })).toEqual({ ...EMPTY_PROGRESS, mastered: [1, 2] })
    expect(normalizeProgress(null)).toEqual(EMPTY_PROGRESS)
  })

  it('merges without losing mastered terms or miss counts from either side', () => {
    const account = progress({ mastered: [1, 2], missed: [3], missedCounts: { 3: 4 }, streak: 9, positions: { flashcards: 10, quiz: 0, type: 0, match: 0 } })
    const here = progress({ mastered: [3, 4], missed: [2, 5], missedCounts: { 3: 1, 5: 2 }, streak: 2, positions: { flashcards: 3, quiz: 1, type: 0, match: 0 } })
    expect(mergeProgress(account, here)).toEqual({
      mastered: [1, 2, 3, 4],
      missed: [5], // 2 and 3 are mastered on one side, so they are no longer missed
      missedCounts: { 3: 4, 5: 2 },
      streak: 2,
      positions: { flashcards: 3, quiz: 1, type: 0, match: 0 },
      learn: {},
      starred: [],
    })
  })
})

describe('loading saved progress', () => {
  it('does nothing when signed out', async () => {
    const { fake, sync } = setup()
    sync.open('d1')
    sync.changed('d1')
    await vi.advanceTimersByTimeAsync(5000)
    expect(fake.calls).toEqual([])
    expect(sync.getStatus('d1')).toBe('idle')
  })

  it('loads a deck\'s progress from the account when it is opened', async () => {
    const { fake, sync } = setup()
    fake.server.set('d1', progress({ mastered: [1, 2] }))
    sync.signedIn('user-1')
    sync.open('d1')
    expect(sync.getStatus('d1')).toBe('loading')
    await settle()
    expect(sync.getStatus('d1')).toBe('ready')
    expect(readProgress('d1').mastered).toEqual([1, 2])
  })

  it('loads a deck that was opened before sign-in was known', async () => {
    const { fake, sync } = setup()
    fake.server.set('d1', progress({ mastered: [7] }))
    sync.open('d1') // the page's effect runs before the app reports who is signed in
    sync.signedIn('user-1')
    await settle()
    expect(readProgress('d1').mastered).toEqual([7])
  })

  it('loads each deck once', async () => {
    const { fake, sync } = setup()
    sync.signedIn('user-1')
    sync.open('d1'); sync.close('d1'); sync.open('d1')
    await settle()
    expect(fake.calls).toEqual(['GET /progress/d1'])
  })

  it('keeps local progress when the account has none saved', async () => {
    const { sync } = setup()
    localStorage.setItem(PROGRESS_OWNER_KEY, 'user-1')
    writeProgress('d1', progress({ mastered: [1] }))
    sync.signedIn('user-1')
    sync.open('d1')
    await settle()
    expect(readProgress('d1').mastered).toEqual([1])
  })

  it('carries on with local progress when the API is down', async () => {
    const { fake, sync } = setup()
    localStorage.setItem(PROGRESS_OWNER_KEY, 'user-1')
    writeProgress('d1', progress({ mastered: [1] }))
    fake.state.fail = true
    sync.signedIn('user-1')
    sync.open('d1')
    await settle()
    expect(sync.getStatus('d1')).toBe('error')
    expect(readProgress('d1').mastered).toEqual([1])
  })

  it('keeps progress on different decks apart', async () => {
    const { fake, sync } = setup()
    fake.server.set('d1', progress({ mastered: [1] }))
    fake.server.set('d2', progress({ mastered: [9] }))
    sync.signedIn('user-1')
    sync.open('d1'); sync.open('d2')
    await settle()
    expect(readProgress('d1').mastered).toEqual([1])
    expect(readProgress('d2').mastered).toEqual([9])
  })
})

describe('saving progress', () => {
  async function ready() {
    const ctx = setup()
    ctx.sync.signedIn('user-1')
    ctx.sync.open('d1')
    await settle()
    ctx.fake.calls.length = 0
    return ctx
  }

  it('batches a burst of changes into one save', async () => {
    const { fake, sync } = await ready()
    for (const id of [1, 2, 3, 4, 5]) {
      writeProgress('d1', progress({ mastered: Array.from({ length: id }, (_, i) => i + 1) }))
      sync.changed('d1')
      await vi.advanceTimersByTimeAsync(300)
    }
    expect(fake.calls).toEqual([]) // nothing sent while the answers keep coming
    await vi.advanceTimersByTimeAsync(1500)
    expect(fake.calls).toEqual(['PUT /progress/d1'])
    expect(fake.server.get('d1')?.mastered).toEqual([1, 2, 3, 4, 5])
    expect(localStorage.getItem(PROGRESS_SYNC_KEY)).toBeNull()
  })

  it('saves straight away when the deck is closed', async () => {
    const { fake, sync } = await ready()
    writeProgress('d1', progress({ mastered: [1] }))
    sync.changed('d1')
    sync.close('d1')
    await settle()
    expect(fake.calls).toEqual(['PUT /progress/d1'])
  })

  it('keeps unsent progress and sends it later', async () => {
    const { fake, sync } = await ready()
    fake.state.fail = true
    writeProgress('d1', progress({ mastered: [1] }))
    sync.changed('d1')
    await vi.advanceTimersByTimeAsync(1500)
    expect(JSON.parse(localStorage.getItem(PROGRESS_SYNC_KEY)!).dirty).toEqual(['d1'])

    fake.state.fail = false
    expect(await sync.flush()).toBe(true)
    expect(fake.server.get('d1')?.mastered).toEqual([1])
  })

  it('sends unsent progress on the next visit rather than overwriting it with the account\'s', async () => {
    const { fake, sync } = await ready()
    fake.state.fail = true
    writeProgress('d1', progress({ mastered: [1, 2, 3] }))
    sync.changed('d1')
    await vi.advanceTimersByTimeAsync(1500)

    fake.state.fail = false
    fake.server.set('d1', progress({ mastered: [1] })) // older copy in the account
    const nextVisit = createProgressSync({ api: fake.api as never })
    nextVisit.signedIn('user-1')
    nextVisit.open('d1')
    await settle()
    expect(readProgress('d1').mastered).toEqual([1, 2, 3])
    expect(fake.server.get('d1')?.mastered).toEqual([1, 2, 3])
  })

  it('lets the account win when this browser has nothing unsent', async () => {
    const { fake } = await ready()
    writeProgress('d1', progress({ mastered: [1] }))
    fake.server.set('d1', progress({ mastered: [1, 2, 3, 4] })) // studied on another device
    const nextVisit = createProgressSync({ api: fake.api as never })
    nextVisit.signedIn('user-1')
    nextVisit.open('d1')
    await settle()
    expect(readProgress('d1').mastered).toEqual([1, 2, 3, 4])
  })
})

describe('signing in with progress made while signed out', () => {
  it('merges it into the account\'s progress instead of replacing either', async () => {
    const { fake, sync } = setup()
    writeProgress('d1', progress({ mastered: [5, 6] }))
    fake.server.set('d1', progress({ mastered: [1, 2] }))
    sync.signedIn('user-1')
    sync.open('d1')
    await settle()
    expect(readProgress('d1').mastered.sort()).toEqual([1, 2, 5, 6])
    expect(fake.server.get('d1')?.mastered.sort()).toEqual([1, 2, 5, 6])
    expect(localStorage.getItem(PROGRESS_SYNC_KEY)).toBeNull()
  })

  it('uploads it when the account has nothing for that deck', async () => {
    const { fake, sync } = setup()
    writeProgress('d1', progress({ mastered: [5] }))
    sync.signedIn('user-1')
    sync.open('d1')
    await settle()
    expect(fake.server.get('d1')?.mastered).toEqual([5])
  })
})

describe('signing out and switching accounts', () => {
  it('removes the account\'s progress from this browser on sign-out', async () => {
    const { fake, sync } = setup()
    fake.server.set('d1', progress({ mastered: [1] }))
    sync.signedIn('user-1')
    sync.open('d1')
    await settle()
    sync.signedOut()
    expect(readAllProgress()).toEqual({})
    expect(localStorage.getItem(PROGRESS_OWNER_KEY)).toBeNull()
    expect(fake.server.get('d1')?.mastered).toEqual([1])
  })

  it('keeps progress that was never sent, so it isn\'t lost', async () => {
    const { fake, sync } = setup()
    sync.signedIn('user-1')
    sync.open('d1')
    await settle()
    fake.state.fail = true
    writeProgress('d1', progress({ mastered: [1] }))
    sync.changed('d1')
    await vi.advanceTimersByTimeAsync(1500)
    sync.signedOut()
    expect(readProgress('d1').mastered).toEqual([1])
  })

  it('leaves a signed-out visitor\'s progress alone', () => {
    const { sync } = setup()
    writeProgress('d1', progress({ mastered: [1] }))
    sync.signedOut()
    expect(readProgress('d1').mastered).toEqual([1])
  })

  it('does not mix in progress cached for a different account', async () => {
    const { fake, sync } = setup()
    localStorage.setItem(PROGRESS_OWNER_KEY, 'alice')
    writeProgress('d1', progress({ mastered: [99] }))
    sync.signedIn('bob')
    sync.open('d1')
    await settle()
    expect(readProgress('d1').mastered).toEqual([])
    expect(fake.server.has('d1')).toBe(false)
  })
})
