import { createRouter } from '../src/router'
import { routes } from '../src/routes'
import { body, makeEvent, memoryDb } from './helpers'

/**
 * The whole API over an in-memory table, with a clock the test controls.
 * Times are given in UTC; the default user timezone is US Central (UTC-6 in winter),
 * so 18:00Z is noon local.
 */
export function createApp(start = '2026-11-21T18:00:00Z') {
  const db = memoryDb()
  let now = new Date(start)
  let n = 0
  const router = createRouter(routes, { db, now: () => now, newId: () => `id${++n}` })

  const as = (sub: string) => {
    const call = async (method: string, path: string, opts: { body?: unknown; query?: Record<string, string> } = {}) => {
      const res = await router(makeEvent(method, path, { ...opts, claims: { sub, email: `${sub}@example.com` } }))
      return { status: res.statusCode, data: res.body ? body(res) : undefined }
    }
    return {
      get: (path: string, query?: Record<string, string>) => call('GET', path, { query }),
      post: (path: string, b: unknown = {}) => call('POST', path, { body: b }),
      patch: (path: string, b: unknown) => call('PATCH', path, { body: b }),
      put: (path: string, b: unknown) => call('PUT', path, { body: b }),
      del: (path: string) => call('DELETE', path),
    }
  }

  return {
    db,
    router,
    as,
    user: as('user-1'),
    /** Moves the clock to the same time of day on a given local date. */
    setDate: (date: string) => { now = new Date(`${date}T18:00:00Z`) },
    setTime: (iso: string) => { now = new Date(iso) },
  }
}
