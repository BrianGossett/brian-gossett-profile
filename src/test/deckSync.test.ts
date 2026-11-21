import { describe, it, expect, beforeEach } from 'vitest'
import { DECKS_KEY, readDecks, writeDecks, type Deck } from '../hooks/deckStore'
import { OWNER_KEY, PENDING_KEY, createDeckSync } from '../hooks/deckSync'
import { createFakeDeckApi } from './fakeDeckApi'

const deck = (id: string, name = id): Deck => ({ id, name, terms: [{ id: 1, category: 'General', term: 't', definition: 'd' }] })
const localIds = () => readDecks().map(d => d.id).sort()
const settle = () => new Promise(r => setTimeout(r, 0))

function setup() {
  const fake = createFakeDeckApi()
  const sync = createDeckSync({ api: fake.api as never })
  return { fake, sync }
}

beforeEach(() => localStorage.clear())

describe('first sign-in: importing decks made while signed out', () => {
  it('uploads every local deck with the same ID', async () => {
    const { fake, sync } = setup()
    writeDecks([deck('local-1'), deck('local-2')])
    await sync.signedIn('user-1')

    expect([...fake.server.keys()].sort()).toEqual(['local-1', 'local-2'])
    expect(fake.server.get('local-1')).toEqual(deck('local-1'))
    expect(localIds()).toEqual(['local-1', 'local-2'])
    expect(localStorage.getItem(OWNER_KEY)).toBe('user-1')
    expect(sync.getStatus()).toBe('ready')
    expect(sync.takeImportedCount()).toBe(2)
    expect(sync.takeImportedCount()).toBe(0)
  })

  it('brings in the decks already in the account alongside them', async () => {
    const { fake, sync } = setup()
    fake.server.set('remote-1', deck('remote-1'))
    writeDecks([deck('local-1')])
    await sync.signedIn('user-1')
    expect(localIds()).toEqual(['local-1', 'remote-1'])
  })

  it('does not import again when the page is reloaded while signed in', async () => {
    const { fake, sync } = setup()
    writeDecks([deck('local-1')])
    await sync.signedIn('user-1')
    fake.calls.length = 0

    const afterReload = createDeckSync({ api: fake.api as never })
    await afterReload.signedIn('user-1')
    expect(fake.calls).toEqual(['GET /decks'])
  })

  it('does not import again after signing out and back in', async () => {
    const { fake, sync } = setup()
    writeDecks([deck('local-1')])
    await sync.signedIn('user-1')
    sync.signedOut()
    fake.calls.length = 0
    await sync.signedIn('user-1')
    expect(fake.calls).toEqual(['GET /decks'])
    expect(fake.server.size).toBe(1)
    expect(localIds()).toEqual(['local-1'])
  })

  it('retries a failed import on the next sign-in, without duplicates', async () => {
    const { fake, sync } = setup()
    writeDecks([deck('local-1'), deck('local-2')])
    fake.failWith('network')
    await sync.signedIn('user-1')

    expect(sync.getStatus()).toBe('error')
    expect(fake.server.size).toBe(0)
    expect(localIds()).toEqual(['local-1', 'local-2']) // still here, nothing lost
    expect(localStorage.getItem(OWNER_KEY)).toBeNull() // so the next sign-in tries again

    fake.succeed()
    await sync.signedIn('user-1')
    expect([...fake.server.keys()].sort()).toEqual(['local-1', 'local-2'])
    expect(sync.getStatus()).toBe('ready')
  })

  it('never duplicates a deck if the import ran but its answer was lost', async () => {
    const { fake, sync } = setup()
    writeDecks([deck('local-1')])
    fake.server.set('local-1', deck('local-1')) // the first attempt reached the server
    await sync.signedIn('user-1')
    expect(fake.server.size).toBe(1)
    expect(localIds()).toEqual(['local-1'])
    expect(sync.takeImportedCount()).toBe(0)
  })

  it('shares one load when sign-in is reported twice at once', async () => {
    const { fake, sync } = setup()
    writeDecks([deck('local-1')])
    await Promise.all([sync.signedIn('user-1'), sync.signedIn('user-1')])
    expect(fake.calls).toEqual(['POST /flashcards/import', 'GET /decks'])
    expect(sync.takeImportedCount()).toBe(1)
  })
})

describe('loading decks from the account', () => {
  it('replaces the browser copy with the account\'s decks', async () => {
    const { fake, sync } = setup()
    writeDecks([deck('gone-on-another-device')])
    localStorage.setItem(OWNER_KEY, 'user-1')
    fake.server.set('remote-1', deck('remote-1'))
    await sync.signedIn('user-1')
    expect(localIds()).toEqual(['remote-1'])
  })

  it('keeps showing cached decks when the API is unreachable', async () => {
    const { fake, sync } = setup()
    writeDecks([deck('cached-1')])
    localStorage.setItem(OWNER_KEY, 'user-1')
    fake.failWith('network')
    await sync.signedIn('user-1')
    expect(sync.getStatus()).toBe('error')
    expect(localIds()).toEqual(['cached-1'])
  })

  it('does not mix in decks cached for a different account', async () => {
    const { fake, sync } = setup()
    writeDecks([deck('alices-deck')])
    localStorage.setItem(OWNER_KEY, 'alice')
    fake.server.set('bobs-deck', deck('bobs-deck'))
    await sync.signedIn('bob')
    expect(localIds()).toEqual(['bobs-deck'])
    expect(fake.calls).not.toContain('POST /flashcards/import')
    expect(fake.server.has('alices-deck')).toBe(false)
  })
})

describe('saving changes', () => {
  async function signedIn() {
    const ctx = setup()
    await ctx.sync.signedIn('user-1')
    ctx.fake.calls.length = 0
    return ctx
  }

  it('saves a new or changed deck to the account', async () => {
    const { fake, sync } = await signedIn()
    writeDecks([deck('d1', 'First')])
    sync.put(deck('d1', 'First'))
    await settle()
    expect(fake.calls).toEqual(['PUT /decks/d1'])
    expect(fake.server.get('d1')?.name).toBe('First')
    expect(localStorage.getItem(PENDING_KEY)).toBeNull()
  })

  it('deletes a deck from the account', async () => {
    const { fake, sync } = await signedIn()
    fake.server.set('d1', deck('d1'))
    sync.remove('d1')
    await settle()
    expect(fake.server.has('d1')).toBe(false)
    expect(localStorage.getItem(PENDING_KEY)).toBeNull()
  })

  it('does nothing when signed out', async () => {
    const { fake, sync } = setup()
    sync.put(deck('d1'))
    sync.remove('d2')
    await settle()
    expect(fake.calls).toEqual([])
    expect(localStorage.getItem(PENDING_KEY)).toBeNull()
  })

  it('remembers a change made offline and sends it on retry', async () => {
    const { fake, sync } = await signedIn()
    fake.failWith('network')
    writeDecks([deck('d1')])
    sync.put(deck('d1'))
    await settle()
    expect(fake.server.has('d1')).toBe(false)
    expect(JSON.parse(localStorage.getItem(PENDING_KEY)!).puts).toEqual(['d1'])

    fake.succeed()
    expect(await sync.retry()).toBe(true)
    expect(fake.server.has('d1')).toBe(true)
    expect(localStorage.getItem(PENDING_KEY)).toBeNull()
  })

  it('sends an offline change on the next load, before reading the account', async () => {
    const { fake, sync } = await signedIn()
    fake.failWith('network')
    writeDecks([deck('d1', 'Edited offline')])
    sync.put(deck('d1', 'Edited offline'))
    await settle()

    fake.succeed()
    fake.server.set('d1', deck('d1', 'Stale server copy'))
    const afterReload = createDeckSync({ api: fake.api as never })
    await afterReload.signedIn('user-1')
    expect(fake.server.get('d1')?.name).toBe('Edited offline')
    expect(readDecks().find(d => d.id === 'd1')?.name).toBe('Edited offline')
  })

  it('does not bring back a deck deleted offline', async () => {
    const { fake, sync } = await signedIn()
    fake.server.set('d1', deck('d1'))
    fake.failWith('network', /DELETE/)
    writeDecks([])
    sync.remove('d1')
    await settle()

    const afterReload = createDeckSync({ api: fake.api as never })
    await afterReload.signedIn('user-1') // DELETE still failing, GET works
    expect(localIds()).toEqual([])
  })

  it('keeps a deck the account refuses in this browser, and stops retrying it', async () => {
    const { fake, sync } = await signedIn()
    fake.failWith('rejected', /PUT/)
    writeDecks([deck('too-big')])
    sync.put(deck('too-big'))
    await settle()
    expect(JSON.parse(localStorage.getItem(PENDING_KEY)!)).toEqual({ puts: [], deletes: [], rejected: ['too-big'] })

    fake.calls.length = 0
    const afterReload = createDeckSync({ api: fake.api as never })
    await afterReload.signedIn('user-1')
    expect(fake.calls).toEqual(['GET /decks'])
    expect(localIds()).toEqual(['too-big'])
  })

  it('a later delete cancels an unsent save of the same deck', async () => {
    const { fake, sync } = await signedIn()
    fake.failWith('network')
    writeDecks([deck('d1')])
    sync.put(deck('d1'))
    await settle()
    writeDecks([])
    sync.remove('d1')
    await settle()
    expect(JSON.parse(localStorage.getItem(PENDING_KEY)!)).toMatchObject({ puts: [], deletes: ['d1'] })
  })
})

describe('signing out', () => {
  it('removes the account\'s decks from this browser', async () => {
    const { fake, sync } = setup()
    fake.server.set('remote-1', deck('remote-1'))
    await sync.signedIn('user-1')
    sync.signedOut()
    expect(localIds()).toEqual([])
    expect(localStorage.getItem(OWNER_KEY)).toBeNull()
    expect(fake.server.has('remote-1')).toBe(true)
    expect(sync.getStatus()).toBe('idle')
  })

  it('keeps a deck whose changes were never sent, and uploads it at the next sign-in', async () => {
    const { fake, sync } = setup()
    await sync.signedIn('user-1')
    fake.failWith('network')
    writeDecks([deck('unsent')])
    sync.put(deck('unsent'))
    await settle()
    sync.signedOut()
    expect(localIds()).toEqual(['unsent'])

    fake.succeed()
    await sync.signedIn('user-1')
    expect(fake.server.has('unsent')).toBe(true)
  })

  it('leaves a signed-out visitor\'s decks alone when nobody was signed in', () => {
    const { sync } = setup()
    writeDecks([deck('mine')])
    sync.signedOut()
    expect(localIds()).toEqual(['mine'])
    expect(localStorage.getItem(DECKS_KEY)).not.toBeNull()
  })

  it('ignores a load that finishes after sign-out', async () => {
    const { fake, sync } = setup()
    fake.server.set('remote-1', deck('remote-1'))
    const loading = sync.signedIn('user-1')
    sync.signedOut()
    await loading
    expect(localIds()).toEqual([])
    expect(sync.getStatus()).toBe('idle')
  })
})
