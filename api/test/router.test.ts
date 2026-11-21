import { HttpError, json } from '../src/http'
import { createRouter, type Route } from '../src/router'
import { body, makeEvent, memoryDb } from './helpers'

const routes: Route[] = [
  { method: 'GET', path: '/things', handler: async ctx => json(200, { userId: ctx.userId }) },
  { method: 'POST', path: '/things/{id}/complete', handler: async ctx => json(200, { id: ctx.params.id }) },
  { method: 'GET', path: '/teapot', handler: async () => { throw new HttpError(418, 'teapot') } },
  { method: 'GET', path: '/boom', handler: async () => { throw new Error('secret detail') } },
]
const router = createRouter(routes, { db: memoryDb() })

describe('router', () => {
  it('routes by method and path', async () => {
    const res = await router(makeEvent('GET', '/things'))
    expect(res.statusCode).toBe(200)
    expect(body(res)).toEqual({ userId: 'user-1' })
  })

  it('extracts path parameters', async () => {
    const res = await router(makeEvent('POST', '/things/abc%20123/complete'))
    expect(body(res)).toEqual({ id: 'abc 123' })
  })

  it('returns 404 for an unknown path', async () => {
    expect((await router(makeEvent('GET', '/nope'))).statusCode).toBe(404)
  })

  it('returns 404 for a known path with the wrong method', async () => {
    expect((await router(makeEvent('DELETE', '/things'))).statusCode).toBe(404)
  })

  it('returns 401 when there are no verified claims', async () => {
    expect((await router(makeEvent('GET', '/things', { claims: null }))).statusCode).toBe(401)
  })

  it('returns 401 when the token has no sub', async () => {
    expect((await router(makeEvent('GET', '/things', { claims: { email: 'a@example.com' } }))).statusCode).toBe(401)
  })

  it('returns 401 before 404, so unknown routes reveal nothing without a token', async () => {
    expect((await router(makeEvent('GET', '/nope', { claims: null }))).statusCode).toBe(401)
  })

  it('takes userId from the token and ignores one in the query or body', async () => {
    const event = makeEvent('GET', '/things', { query: { userId: 'attacker' }, body: { userId: 'attacker' } })
    expect(body(await router(event))).toEqual({ userId: 'user-1' })
  })

  it('turns an HttpError into its status', async () => {
    const res = await router(makeEvent('GET', '/teapot'))
    expect(res.statusCode).toBe(418)
    expect(body(res)).toEqual({ message: 'teapot' })
  })

  it('hides unexpected errors behind a 500', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await router(makeEvent('GET', '/boom'))
    spy.mockRestore()
    expect(res.statusCode).toBe(500)
    expect(res.body).not.toContain('secret detail')
  })
})
