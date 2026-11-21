import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ApiError, createApiClient } from '../api/client'
import { createTokenManager, saveTokens } from '../auth/tokens'
import { config, jsonResponse } from './authHelpers'

const NOW = 1_800_000_000_000
const signedIn = (idToken = 'id-1') => saveTokens({ idToken, accessToken: 'a', refreshToken: 'refresh', expiresAt: NOW + 3_600_000 })

beforeEach(() => localStorage.clear())

function setup(apiFetch: typeof fetch, tokenFetch: typeof fetch = vi.fn()) {
  const tokens = createTokenManager({ config, fetch: tokenFetch, now: () => NOW })
  return createApiClient({ config, fetch: apiFetch, tokens })
}

describe('api client', () => {
  it('sends the ID token as a bearer token', async () => {
    signedIn()
    const fetchMock = vi.fn(async () => jsonResponse(200, { points: 5 }))
    expect(await setup(fetchMock)('/me')).toEqual({ points: 5 })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.test/me')
    expect(init.method).toBe('GET')
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer id-1')
  })

  it('sends a JSON body and query string', async () => {
    signedIn()
    const fetchMock = vi.fn(async () => jsonResponse(201, { id: 't_1' }))
    const api = setup(fetchMock)
    await api('/tasks', { method: 'POST', body: { title: 'x', size: 'small' } })
    await api('/summary', { query: { period: 'week' } })
    const [, post] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(post.body).toBe('{"title":"x","size":"small"}')
    expect((post.headers as Record<string, string>)['content-type']).toBe('application/json')
    expect((fetchMock.mock.calls[1] as unknown as [string])[0]).toBe('https://api.test/summary?period=week')
  })

  it('throws 401 when signed out, without calling the API', async () => {
    const fetchMock = vi.fn()
    await expect(setup(fetchMock)('/me')).rejects.toMatchObject({ status: 401 })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('renews the token once and retries when the API answers 401', async () => {
    signedIn('stale')
    const apiFetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthorized' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))
    const tokenFetch = vi.fn(async () => jsonResponse(200, { id_token: 'renewed', access_token: 'a', expires_in: 3600 }))
    expect(await setup(apiFetch, tokenFetch)('/me')).toEqual({ ok: true })
    expect(tokenFetch).toHaveBeenCalledTimes(1)
    const [, retry] = apiFetch.mock.calls[1] as unknown as [string, RequestInit]
    expect((retry.headers as Record<string, string>).authorization).toBe('Bearer renewed')
  })

  it('does not retry forever when the API keeps answering 401', async () => {
    signedIn()
    const apiFetch = vi.fn(async () => jsonResponse(401, { message: 'Unauthorized' }))
    const tokenFetch = vi.fn(async () => jsonResponse(200, { id_token: 'renewed', access_token: 'a', expires_in: 3600 }))
    await expect(setup(apiFetch, tokenFetch)('/me')).rejects.toMatchObject({ status: 401 })
    expect(apiFetch).toHaveBeenCalledTimes(2)
  })

  it('throws ApiError with the API\'s message on other failures', async () => {
    signedIn()
    const error = await setup(vi.fn(async () => jsonResponse(409, { message: 'Already completed today' })))('/tasks/d_1/complete', { method: 'POST' }).catch(e => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, message: 'Already completed today' })
  })

  it('returns undefined for 204', async () => {
    signedIn()
    expect(await setup(vi.fn(async () => new Response(null, { status: 204 })))('/tasks/t_1', { method: 'DELETE' })).toBeUndefined()
  })
})
