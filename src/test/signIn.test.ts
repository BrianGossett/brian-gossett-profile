import { describe, it, expect, beforeEach, vi } from 'vitest'
import { challengeFor } from '../auth/pkce'
import { AuthError, PENDING_KEY, buildSignInUrl, completeSignIn, isCallback, safeReturnTo, signIn, signOut } from '../auth/signIn'
import { createTokenManager, loadTokens, saveTokens } from '../auth/tokens'
import { config, fakeIdToken, jsonResponse } from './authHelpers'

const NOW = 1_800_000_000_000
const origin = window.location.origin

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

const pending = () => JSON.parse(sessionStorage.getItem(PENDING_KEY)!) as { state: string; verifier: string; returnTo: string }

describe('safeReturnTo', () => {
  it('keeps paths inside the app', () => {
    expect(safeReturnTo('/study/default/flashcards?x=1#top')).toBe('/study/default/flashcards?x=1#top')
  })

  it.each(['https://evil.example', '//evil.example', '/\\evil.example', 'study', '', null, undefined])(
    'replaces %j with /todo',
    path => expect(safeReturnTo(path)).toBe('/todo'),
  )
})

describe('starting sign-in', () => {
  it('builds a code-flow URL with PKCE and Google as the provider', async () => {
    const url = new URL(await buildSignInUrl('/study', { config }))
    expect(url.origin + url.pathname).toBe('https://auth.test/oauth2/authorize')
    const p = Object.fromEntries(url.searchParams)
    expect(p).toMatchObject({
      response_type: 'code',
      client_id: 'client-123',
      redirect_uri: `${origin}/todo`,
      scope: 'openid email profile',
      identity_provider: 'Google',
      code_challenge_method: 'S256',
    })
    expect(p.state).toBe(pending().state)
    expect(p.code_challenge).toBe(await challengeFor(pending().verifier))
  })

  it('never puts the verifier or a client secret in the URL', async () => {
    const url = await buildSignInUrl('/study', { config })
    expect(url).not.toContain(pending().verifier)
    expect(url).not.toContain('client_secret')
  })

  it('remembers where to come back to', async () => {
    await buildSignInUrl('/study/abc/quiz', { config })
    expect(pending().returnTo).toBe('/study/abc/quiz')
  })

  it('redirects the browser to the sign-in URL', async () => {
    const redirect = vi.fn()
    await signIn('/study', { config, redirect })
    expect(redirect).toHaveBeenCalledWith(expect.stringContaining('https://auth.test/oauth2/authorize?'))
  })
})

describe('isCallback', () => {
  it('recognises a sign-in response', () => {
    expect(isCallback('?code=abc&state=xyz')).toBe(true)
    expect(isCallback('?error=access_denied')).toBe(true)
    expect(isCallback('')).toBe(false)
    expect(isCallback('?deck=abc')).toBe(false)
  })
})

describe('finishing sign-in', () => {
  const idToken = fakeIdToken({ sub: 'u1', email: 'a@example.com' })
  const ok = () => vi.fn(async () => jsonResponse(200, { id_token: idToken, access_token: 'access', refresh_token: 'refresh', expires_in: 3600 }))
  const deps = (fetchMock: typeof fetch) => ({ config, fetch: fetchMock, now: () => NOW, tokens: createTokenManager({ config, fetch: fetchMock, now: () => NOW }) })

  it('swaps the code for tokens using the verifier, and returns to the starting page', async () => {
    await buildSignInUrl('/study/default/flashcards', { config })
    const { state, verifier } = pending()
    const fetchMock = ok()
    const returnTo = await completeSignIn(`?code=the-code&state=${state}`, deps(fetchMock))

    expect(returnTo).toBe('/study/default/flashcards')
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://auth.test/oauth2/token')
    expect(Object.fromEntries(init.body as URLSearchParams)).toEqual({
      grant_type: 'authorization_code',
      client_id: 'client-123',
      code: 'the-code',
      redirect_uri: `${origin}/todo`,
      code_verifier: verifier,
    })
    expect(loadTokens()).toEqual({ idToken, accessToken: 'access', refreshToken: 'refresh', expiresAt: NOW + 3_600_000 })
    expect(sessionStorage.getItem(PENDING_KEY)).toBeNull()
  })

  it('refuses a response whose state does not match, without calling the token endpoint', async () => {
    await buildSignInUrl('/study', { config })
    const fetchMock = ok()
    await expect(completeSignIn('?code=the-code&state=forged', deps(fetchMock))).rejects.toThrow(AuthError)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(loadTokens()).toBeNull()
  })

  it('refuses a code when this browser did not start a sign-in', async () => {
    const fetchMock = ok()
    await expect(completeSignIn('?code=the-code&state=anything', deps(fetchMock))).rejects.toThrow(AuthError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('cannot be replayed: the pending sign-in is used once', async () => {
    await buildSignInUrl('/study', { config })
    const { state } = pending()
    await completeSignIn(`?code=the-code&state=${state}`, deps(ok()))
    await expect(completeSignIn(`?code=the-code&state=${state}`, deps(ok()))).rejects.toThrow(AuthError)
  })

  it('reports an error Cognito sent back', async () => {
    await buildSignInUrl('/study', { config })
    await expect(completeSignIn('?error=access_denied&error_description=User+cancelled', deps(ok()))).rejects.toThrow('User cancelled')
    expect(loadTokens()).toBeNull()
  })

  it('fails without storing tokens when the token endpoint refuses the code', async () => {
    await buildSignInUrl('/study', { config })
    const { state } = pending()
    const fetchMock = vi.fn(async () => jsonResponse(400, { error: 'invalid_grant' }))
    await expect(completeSignIn(`?code=bad&state=${state}`, deps(fetchMock))).rejects.toThrow(AuthError)
    expect(loadTokens()).toBeNull()
  })

  it('falls back to /todo if the remembered return address was tampered with', async () => {
    await buildSignInUrl('/study', { config })
    const p = pending()
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ ...p, returnTo: 'https://evil.example' }))
    expect(await completeSignIn(`?code=c&state=${p.state}`, deps(ok()))).toBe('/todo')
  })
})

describe('signing out', () => {
  it('clears tokens and ends the Cognito session', () => {
    saveTokens({ idToken: 'i', accessToken: 'a', refreshToken: 'r', expiresAt: NOW + 1000 })
    const redirect = vi.fn()
    signOut({ config, redirect, tokens: createTokenManager({ config }) })
    expect(loadTokens()).toBeNull()
    const url = new URL(redirect.mock.calls[0][0] as string)
    expect(url.origin + url.pathname).toBe('https://auth.test/logout')
    expect(Object.fromEntries(url.searchParams)).toEqual({ client_id: 'client-123', logout_uri: `${origin}/todo` })
  })
})

describe('signInErrorMessage', () => {
  it('unwraps a refusal from the invitation check', async () => {
    const { signInErrorMessage } = await import('../auth/signIn')
    expect(signInErrorMessage('PreSignUp failed with error Sign-in is by invitation only. Ask the site owner to add your email address.. '))
      .toBe('Sign-in is by invitation only. Ask the site owner to add your email address.')
    expect(signInErrorMessage('PreSignUp failed with error Sign-in is by invitation only.'))
      .toBe('Sign-in is by invitation only.')
  })
  it('leaves other errors as they are', async () => {
    const { signInErrorMessage } = await import('../auth/signIn')
    expect(signInErrorMessage('User cancelled')).toBe('User cancelled')
  })
})
