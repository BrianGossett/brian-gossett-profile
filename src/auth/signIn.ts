import { authConfig, redirectUri, type AuthConfig } from './config'
import { challengeFor, createVerifier, randomString } from './pkce'
import { fromResponse, tokenManager, type TokenManager, type TokenResponse } from './tokens'

export const PENDING_KEY = 'profile-auth-pending'

interface Pending {
  state: string
  verifier: string
  returnTo: string
}

export class AuthError extends Error {}

function parsePending(raw: string | null): Pending | null {
  try {
    const p = raw ? (JSON.parse(raw) as Partial<Pending>) : null
    return p && typeof p.state === 'string' && typeof p.verifier === 'string' ? { ...p, returnTo: p.returnTo ?? '/todo' } as Pending : null
  } catch {
    return null
  }
}

/**
 * Only paths inside this app are allowed as a return address, so a crafted
 * link can't use sign-in to send someone to another site.
 */
export function safeReturnTo(path: string | null | undefined): string {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return '/todo'
  return path
}

interface Deps {
  config?: AuthConfig
  fetch?: typeof fetch
  now?: () => number
  tokens?: TokenManager
  /** Navigates the browser away. Replaced in tests. */
  redirect?: (url: string) => void
}

/** Builds the Cognito sign-in address and remembers what is needed to finish the sign-in. */
export async function buildSignInUrl(returnTo: string, deps: Deps = {}): Promise<string> {
  const config = deps.config ?? authConfig
  const pending: Pending = { state: randomString(16), verifier: createVerifier(), returnTo: safeReturnTo(returnTo) }
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: redirectUri(),
    scope: 'openid email profile',
    identity_provider: 'Google',
    state: pending.state,
    code_challenge: await challengeFor(pending.verifier),
    code_challenge_method: 'S256',
  })
  return `${config.cognitoDomain}/oauth2/authorize?${params}`
}

/** Sends the browser to Google sign-in. `returnTo` is the in-app path to come back to. */
export async function signIn(returnTo: string, deps: Deps = {}): Promise<void> {
  const url = await buildSignInUrl(returnTo, deps)
  ;(deps.redirect ?? (u => window.location.assign(u)))(url)
}

/** True when the URL is Cognito returning from a sign-in attempt. */
export const isCallback = (search: string) => {
  const params = new URLSearchParams(search)
  return params.has('code') || params.has('error')
}

/**
 * Finishes a sign-in from the `?code=…&state=…` Cognito added to /todo: checks
 * the state, swaps the code for tokens, and returns the path to go back to.
 */
export async function completeSignIn(search: string, deps: Deps = {}): Promise<string> {
  const config = deps.config ?? authConfig
  const doFetch = deps.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args))
  const tokens = deps.tokens ?? tokenManager
  const params = new URLSearchParams(search)

  const raw = sessionStorage.getItem(PENDING_KEY)
  sessionStorage.removeItem(PENDING_KEY)

  const error = params.get('error')
  if (error) throw new AuthError(signInErrorMessage(params.get('error_description') ?? error))

  const pending = parsePending(raw)
  const code = params.get('code')
  if (!code || !pending) throw new AuthError('This sign-in link is no longer valid. Please sign in again.')
  // The state proves this response belongs to the sign-in this browser started.
  if (params.get('state') !== pending.state) throw new AuthError('Sign-in could not be verified. Please sign in again.')

  const res = await doFetch(`${config.cognitoDomain}/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      code,
      redirect_uri: redirectUri(),
      code_verifier: pending.verifier,
    }),
  })
  if (!res.ok) throw new AuthError('Sign-in failed. Please try again.')
  tokens.set(fromResponse((await res.json()) as TokenResponse, (deps.now ?? Date.now)()))
  return safeReturnTo(pending.returnTo)
}

/** Clears this browser's tokens and ends the Cognito session, returning to /todo. */
export function signOut(deps: Deps = {}): void {
  const config = deps.config ?? authConfig
  ;(deps.tokens ?? tokenManager).set(null)
  const params = new URLSearchParams({ client_id: config.clientId, logout_uri: redirectUri() })
  ;(deps.redirect ?? (u => window.location.assign(u)))(`${config.cognitoDomain}/logout?${params}`)
}

/**
 * Cognito wraps a refusal from the invitation check as
 * "PreSignUp failed with error <message>." Show just the message.
 */
export function signInErrorMessage(description: string): string {
  const match = /PreSignUp failed with error (.+?)[.\s]*$/.exec(description)
  return match ? `${match[1]}.` : description
}
