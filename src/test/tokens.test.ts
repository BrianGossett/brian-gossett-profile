import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  TOKENS_KEY,
  createTokenManager,
  decodeUser,
  fromResponse,
  isExpired,
  loadTokens,
  saveTokens,
  type Tokens,
} from '../auth/tokens'
import { config, fakeIdToken, jsonResponse } from './authHelpers'

const NOW = 1_800_000_000_000
const fresh: Tokens = { idToken: fakeIdToken({ sub: 'u1', email: 'a@example.com', name: 'Ada' }), accessToken: 'access', refreshToken: 'refresh', expiresAt: NOW + 3_600_000 }
const expired: Tokens = { ...fresh, expiresAt: NOW - 1 }

beforeEach(() => localStorage.clear())

describe('token storage', () => {
  it('saves and loads tokens', () => {
    saveTokens(fresh)
    expect(loadTokens()).toEqual(fresh)
  })

  it('returns null when nothing is stored, or what is stored is not tokens', () => {
    expect(loadTokens()).toBeNull()
    localStorage.setItem(TOKENS_KEY, 'not json')
    expect(loadTokens()).toBeNull()
    localStorage.setItem(TOKENS_KEY, JSON.stringify({ idToken: 'x' }))
    expect(loadTokens()).toBeNull()
  })

  it('treats a token as expired a minute early', () => {
    expect(isExpired(fresh, NOW)).toBe(false)
    expect(isExpired({ ...fresh, expiresAt: NOW + 30_000 }, NOW)).toBe(true)
    expect(isExpired(expired, NOW)).toBe(true)
  })

  it('keeps the old refresh token when a refresh response has none', () => {
    const next = fromResponse({ id_token: 'i', access_token: 'a', expires_in: 3600 }, NOW, fresh)
    expect(next).toEqual({ idToken: 'i', accessToken: 'a', refreshToken: 'refresh', expiresAt: NOW + 3_600_000 })
  })
})

describe('decodeUser', () => {
  it('reads the user from an ID token', () => {
    expect(decodeUser(fakeIdToken({ sub: 'u1', email: 'a@example.com', name: 'Ada', picture: 'https://p' }))).toEqual({
      sub: 'u1', email: 'a@example.com', name: 'Ada', picture: 'https://p',
    })
  })

  it('handles names with non-ASCII characters', () => {
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ sub: 'u1', name: 'Zoë Müller' }))))
    expect(decodeUser(`h.${payload}.s`)?.name).toBe('Zoë Müller')
  })

  it('returns null for anything that is not a token with a sub', () => {
    expect(decodeUser('garbage')).toBeNull()
    expect(decodeUser(fakeIdToken({ email: 'a@example.com' }))).toBeNull()
  })
})

describe('token manager', () => {
  const setup = (fetchImpl: typeof fetch) => createTokenManager({ config, fetch: fetchImpl, now: () => NOW })

  it('returns null when signed out, without calling the network', async () => {
    const fetchMock = vi.fn()
    expect(await setup(fetchMock).getIdToken()).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns the stored token while it is still valid, without refreshing', async () => {
    saveTokens(fresh)
    const fetchMock = vi.fn()
    expect(await setup(fetchMock).getIdToken()).toBe(fresh.idToken)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refreshes an expired token with the refresh token and stores the result', async () => {
    saveTokens(expired)
    const fetchMock = vi.fn(async () => jsonResponse(200, { id_token: 'new-id', access_token: 'new-access', expires_in: 3600 }))
    expect(await setup(fetchMock).getIdToken()).toBe('new-id')

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://auth.test/oauth2/token')
    expect(init.method).toBe('POST')
    const body = init.body as URLSearchParams
    expect(Object.fromEntries(body)).toEqual({ grant_type: 'refresh_token', client_id: 'client-123', refresh_token: 'refresh' })
    expect(loadTokens()).toEqual({ idToken: 'new-id', accessToken: 'new-access', refreshToken: 'refresh', expiresAt: NOW + 3_600_000 })
  })

  it('shares one refresh between callers that ask at the same time', async () => {
    saveTokens(expired)
    const fetchMock = vi.fn(async () => jsonResponse(200, { id_token: 'new-id', access_token: 'a', expires_in: 3600 }))
    const manager = setup(fetchMock)
    expect(await Promise.all([manager.getIdToken(), manager.getIdToken(), manager.getIdToken()])).toEqual(['new-id', 'new-id', 'new-id'])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('signs out when the refresh token is rejected', async () => {
    saveTokens(expired)
    const manager = setup(vi.fn(async () => jsonResponse(400, { error: 'invalid_grant' })))
    expect(await manager.getIdToken()).toBeNull()
    expect(loadTokens()).toBeNull()
    expect(manager.user()).toBeNull()
  })

  it('stays signed in when the network is down, and returns no token', async () => {
    saveTokens(expired)
    const manager = setup(vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    expect(await manager.getIdToken()).toBeNull()
    expect(loadTokens()).toEqual(expired)
  })

  it('stays signed in when Cognito has a server error', async () => {
    saveTokens(expired)
    expect(await setup(vi.fn(async () => jsonResponse(503, {}))).getIdToken()).toBeNull()
    expect(loadTokens()).toEqual(expired)
  })

  it('signs out when there is no refresh token to use', async () => {
    saveTokens({ ...expired, refreshToken: undefined })
    const fetchMock = vi.fn()
    expect(await setup(fetchMock).getIdToken()).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(loadTokens()).toBeNull()
  })

  it('tells subscribers when tokens are stored or cleared', () => {
    const manager = setup(vi.fn())
    const listener = vi.fn()
    const unsubscribe = manager.subscribe(listener)
    manager.set(fresh)
    expect(manager.user()).toMatchObject({ sub: 'u1', name: 'Ada' })
    manager.set(null)
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
    manager.set(fresh)
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
