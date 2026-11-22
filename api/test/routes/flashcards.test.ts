import { createApp } from '../app'

const terms = [
  { id: 1, category: 'Scales', term: 'Major scale', definition: 'W-W-H-W-W-W-H' },
  { id: 2, category: 'General', term: 'Tempo', definition: 'The speed of the music' },
]
const deck = (id: string, name = 'My deck') => ({ id, name, terms })

describe('decks', () => {
  it('round-trips the same { id, name, terms } shape the app uses', async () => {
    const { user } = createApp()
    const id = '3f2b8c1e-7a4d-4e9b-9c2a-5d6e7f8091a2' // the app makes IDs with crypto.randomUUID()
    const created = await user.put(`/decks/${id}`, { name: 'My deck', terms })
    expect(created.status).toBe(201)
    expect(created.data).toEqual({ id, name: 'My deck', terms })
    expect((await user.get(`/decks/${id}`)).data).toEqual({ id, name: 'My deck', terms })
    expect((await user.get('/decks')).data).toEqual({ decks: [{ id, name: 'My deck', terms }] })
  })

  it('replaces the name and terms on update, keeping the id', async () => {
    const { user } = createApp()
    await user.put('/decks/d1', { name: 'Old', terms })
    const updated = await user.put('/decks/d1', { name: 'New', terms: [terms[0]] })
    expect(updated.status).toBe(200)
    expect(updated.data).toEqual({ id: 'd1', name: 'New', terms: [terms[0]] })
    expect((await user.get('/decks')).data.decks).toHaveLength(1)
  })

  it('drops fields a deck does not have', async () => {
    const { user } = createApp()
    const res = await user.put('/decks/d1', { name: 'x', owner: 'someone', terms: [{ ...terms[0], extra: true }] })
    expect(res.data).toEqual({ id: 'd1', name: 'x', terms: [terms[0]] })
  })

  it('creates with POST, using the given id or making one', async () => {
    const { user } = createApp()
    expect((await user.post('/decks', deck('given'))).data.id).toBe('given')
    expect((await user.post('/decks', { name: 'x', terms })).data.id).toBeTruthy()
    expect((await user.post('/decks', deck('given'))).status).toBe(409)
  })

  it('deletes a deck and its saved progress', async () => {
    const { user } = createApp()
    await user.put('/decks/d1', { name: 'x', terms })
    await user.put('/progress/d1', { progress: { mastered: [1] } })
    expect((await user.del('/decks/d1')).status).toBe(204)
    expect((await user.get('/decks')).data.decks).toEqual([])
    expect((await user.get('/decks/d1')).status).toBe(404)
    expect((await user.get('/progress/d1')).data.progress).toBeNull()
  })

  it('accepts a deck with no terms yet', async () => {
    const { user } = createApp()
    expect((await user.put('/decks/d1', { name: 'Empty', terms: [] })).status).toBe(201)
  })

  it.each([
    ['default', { name: 'x', terms }, 'built in'],
    ['bad id!', { name: 'x', terms }, 'deck id'],
    ['d1', { terms }, 'name'],
    ['d1', { name: 'x' }, 'terms'],
    ['d1', { name: 'x', terms: [{ id: 'one', category: 'c', term: 't', definition: 'd' }] }, 'terms[0].id'],
    ['d1', { name: 'x', terms: [{ id: 1, category: 'c', term: 't' }] }, 'terms[0].definition'],
  ])('rejects PUT /decks/%s %j', async (id, input, message) => {
    const { user } = createApp()
    const res = await user.put(`/decks/${encodeURIComponent(id)}`, input)
    expect(res.status).toBe(400)
    expect(res.data.message).toContain(message)
  })

  it('rejects a deck too large to store', async () => {
    const { user } = createApp()
    const big = Array.from({ length: 400 }, (_, i) => ({ id: i, category: 'c', term: 't', definition: 'x'.repeat(1000) }))
    expect((await user.put('/decks/d1', { name: 'Big', terms: big })).status).toBe(413)
  })

  it('keeps each user\'s decks private', async () => {
    const { as } = createApp()
    await as('alice').put('/decks/d1', { name: 'Private', terms })
    const mallory = as('mallory')
    expect((await mallory.get('/decks')).data.decks).toEqual([])
    expect((await mallory.get('/decks/d1')).status).toBe(404)
    await mallory.del('/decks/d1')
    await mallory.put('/decks/d1', { name: 'Mine', terms: [] })
    expect((await as('alice').get('/decks/d1')).data).toEqual({ id: 'd1', name: 'Private', terms })
  })
})

describe('progress', () => {
  it('returns null before anything is saved', async () => {
    const { user } = createApp()
    expect((await user.get('/progress/d1')).data).toEqual({ deckId: 'd1', progress: null, updatedAt: null })
  })

  it('stores and returns progress per deck', async () => {
    const { user } = createApp()
    await user.put('/progress/d1', { progress: { mastered: [1, 2], positions: { flashcards: 3 } } })
    await user.put('/progress/d2', { progress: { mastered: [9] } })
    expect((await user.get('/progress/d1')).data.progress).toEqual({ mastered: [1, 2], positions: { flashcards: 3 } })
    expect((await user.get('/progress/d2')).data.progress).toEqual({ mastered: [9] })
  })

  it('works for the built-in default deck', async () => {
    const { user } = createApp()
    expect((await user.put('/progress/default', { progress: { mastered: [5] } })).status).toBe(200)
    expect((await user.get('/progress/default')).data.progress).toEqual({ mastered: [5] })
  })

  it.each([[{}], [{ progress: null }], [{ progress: [1, 2] }], [{ progress: 'text' }]])('rejects %j', async input => {
    const { user } = createApp()
    expect((await user.put('/progress/d1', input)).status).toBe(400)
  })

  it('keeps each user\'s progress private', async () => {
    const { as } = createApp()
    await as('alice').put('/progress/d1', { progress: { mastered: [1] } })
    expect((await as('mallory').get('/progress/d1')).data.progress).toBeNull()
  })
})

describe('POST /flashcards/import', () => {
  it('stores decks with the ids they already have', async () => {
    const { user } = createApp()
    const res = await user.post('/flashcards/import', { decks: [deck('local-1', 'One'), deck('local-2', 'Two')] })
    expect(res.status).toBe(200)
    expect(res.data).toEqual({ imported: ['local-1', 'local-2'], skipped: [] })
    expect((await user.get('/decks')).data.decks).toEqual([deck('local-1', 'One'), deck('local-2', 'Two')])
  })

  it('is a no-op the second time: no duplicates, nothing overwritten', async () => {
    const { user } = createApp()
    await user.post('/flashcards/import', { decks: [deck('local-1', 'One')] })
    await user.put('/decks/local-1', { name: 'Edited since', terms: [] })
    const again = await user.post('/flashcards/import', { decks: [deck('local-1', 'One'), deck('local-2', 'Two')] })
    expect(again.data).toEqual({ imported: ['local-2'], skipped: ['local-1'] })
    const decks = (await user.get('/decks')).data.decks
    expect(decks).toHaveLength(2)
    expect(decks[0]).toEqual({ id: 'local-1', name: 'Edited since', terms: [] })
  })

  it('writes nothing if any deck in the batch is invalid', async () => {
    const { user } = createApp()
    const res = await user.post('/flashcards/import', { decks: [deck('good'), { id: 'bad', name: '', terms }] })
    expect(res.status).toBe(400)
    expect((await user.get('/decks')).data.decks).toEqual([])
  })

  it.each([
    [{}],
    [{ decks: 'x' }],
    [{ decks: [deck('default')] }],
    [{ decks: [deck('same'), deck('same')] }],
  ])('rejects %j', async input => {
    const { user } = createApp()
    expect((await user.post('/flashcards/import', input)).status).toBe(400)
  })

  it('accepts an empty list', async () => {
    const { user } = createApp()
    expect((await user.post('/flashcards/import', { decks: [] })).data).toEqual({ imported: [], skipped: [] })
  })

  it('imports into the caller\'s account only', async () => {
    const { as } = createApp()
    await as('alice').post('/flashcards/import', { decks: [deck('d1')] })
    expect((await as('mallory').get('/decks')).data.decks).toEqual([])
    expect((await as('mallory').post('/flashcards/import', { decks: [deck('d1', 'Mallory copy')] })).data.imported).toEqual(['d1'])
    expect((await as('alice').get('/decks/d1')).data.name).toBe('My deck')
  })
})

describe('flashcard routes without a token', () => {
  it.each([
    ['GET', '/decks'],
    ['PUT', '/decks/d1'],
    ['GET', '/progress/d1'],
    ['PUT', '/progress/d1'],
    ['POST', '/flashcards/import'],
  ])('%s %s returns 401', async (method, path) => {
    const { router } = createApp()
    const { makeEvent } = await import('../helpers')
    expect((await router(makeEvent(method, path, { claims: null, body: {} }))).statusCode).toBe(401)
  })
})
