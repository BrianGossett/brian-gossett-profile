import { createRouter } from '../../src/router'
import { meRoutes } from '../../src/routes/me'
import { body, makeEvent, memoryDb } from '../helpers'

const setup = () => {
  const db = memoryDb()
  const router = createRouter(meRoutes, { db, now: () => new Date('2026-11-21T12:00:00Z') })
  return { db, router }
}

describe('GET /me', () => {
  it('creates the profile from the token on first call', async () => {
    const { db, router } = setup()
    const res = await router(makeEvent('GET', '/me'))
    expect(res.statusCode).toBe(200)
    expect(body(res)).toEqual({
      userId: 'user-1',
      email: 'a@example.com',
      name: 'Ada',
      picture: null,
      points: 0,
      timezone: 'America/Chicago',
      householdId: 'user-1',
      createdAt: '2026-11-21T12:00:00.000Z',
    })
    expect(db.items.get('USER#user-1|PROFILE')).toMatchObject({ PK: 'USER#user-1', SK: 'PROFILE' })
  })

  it('returns the stored profile on later calls without rewriting it', async () => {
    const { db, router } = setup()
    await router(makeEvent('GET', '/me'))
    const later = createRouter(meRoutes, { db, now: () => new Date('2027-01-01T00:00:00Z') })
    const res = await later(makeEvent('GET', '/me', { claims: { sub: 'user-1', email: 'changed@example.com' } }))
    expect(body(res)).toMatchObject({ email: 'a@example.com', createdAt: '2026-11-21T12:00:00.000Z' })
    expect(db.items.size).toBe(1)
  })

  it('uses the token sub, never a userId from the query or body', async () => {
    const { db, router } = setup()
    const res = await router(makeEvent('GET', '/me', { query: { userId: 'victim' }, body: { userId: 'victim' } }))
    expect(body(res).userId).toBe('user-1')
    expect([...db.items.keys()]).toEqual(['USER#user-1|PROFILE'])
  })

  it('keeps each user in their own partition', async () => {
    const { db, router } = setup()
    await router(makeEvent('GET', '/me'))
    await router(makeEvent('GET', '/me', { claims: { sub: 'user-2', email: 'b@example.com' } }))
    expect([...db.items.keys()].sort()).toEqual(['USER#user-1|PROFILE', 'USER#user-2|PROFILE'])
  })

  it('returns 401 without a token', async () => {
    const { router } = setup()
    expect((await router(makeEvent('GET', '/me', { claims: null }))).statusCode).toBe(401)
  })

  it('reads the winner\'s profile if two first calls race', async () => {
    const { db, router } = setup()
    const original = db.get.bind(db)
    let first = true
    db.get = async (pk, sk) => {
      if (first) {
        first = false
        // Another request creates the profile between this request's read and write.
        await db.putIfAbsent({ PK: pk, SK: sk, email: 'winner@example.com', createdAt: '2026-01-01T00:00:00.000Z' })
        return undefined
      }
      return original(pk, sk)
    }
    const res = await router(makeEvent('GET', '/me'))
    expect(body(res)).toMatchObject({ email: 'winner@example.com', createdAt: '2026-01-01T00:00:00.000Z' })
  })
})

describe('PATCH /me', () => {
  it('changes the timezone', async () => {
    const { db, router } = setup()
    const res = await router(makeEvent('PATCH', '/me', { body: { timezone: 'Europe/London' } }))
    expect(res.statusCode).toBe(200)
    expect(body(res).timezone).toBe('Europe/London')
    expect(db.items.get('USER#user-1|PROFILE')).toMatchObject({ timezone: 'Europe/London', email: 'a@example.com' })
  })

  it('rejects a timezone that does not exist', async () => {
    const { router } = setup()
    expect((await router(makeEvent('PATCH', '/me', { body: { timezone: 'Mars/Olympus' } }))).statusCode).toBe(400)
  })

  it('cannot be used to set points or another field', async () => {
    const { db, router } = setup()
    await router(makeEvent('PATCH', '/me', { body: { timezone: 'UTC', points: 9999, householdId: 'someone-else' } }))
    expect(db.items.get('USER#user-1|PROFILE')).toMatchObject({ points: 0, householdId: 'user-1' })
  })
})
