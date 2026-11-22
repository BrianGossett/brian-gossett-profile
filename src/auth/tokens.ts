import { authConfig, type AuthConfig } from './config'

export const TOKENS_KEY = 'profile-auth-tokens'

export interface Tokens {
  idToken: string
  accessToken: string
  /** Missing after a refresh response; the previous one is kept. */
  refreshToken?: string
  /** When the ID token expires, in milliseconds since the epoch. */
  expiresAt: number
}

export interface AuthUser {
  /** The Cognito user ID. */
  sub: string
  email: string | null
  name: string | null
  picture: string | null
}

/** What Cognito's token endpoint returns. */
export interface TokenResponse {
  id_token: string
  access_token: string
  refresh_token?: string
  expires_in: number
}

/** Treat a token as expired this long before it really is, to allow for request time. */
const EXPIRY_MARGIN_MS = 60_000

export function loadTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(TOKENS_KEY)
    if (!raw) return null
    const t = JSON.parse(raw) as Partial<Tokens>
    if (typeof t.idToken !== 'string' || typeof t.accessToken !== 'string' || typeof t.expiresAt !== 'number') return null
    return t as Tokens
  } catch {
    return null
  }
}

export const saveTokens = (tokens: Tokens) => localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens))
export const clearTokens = () => localStorage.removeItem(TOKENS_KEY)

export const isExpired = (tokens: Tokens, now: number) => now >= tokens.expiresAt - EXPIRY_MARGIN_MS

export function fromResponse(res: TokenResponse, now: number, previous?: Tokens | null): Tokens {
  return {
    idToken: res.id_token,
    accessToken: res.access_token,
    refreshToken: res.refresh_token ?? previous?.refreshToken,
    expiresAt: now + res.expires_in * 1000,
  }
}

/**
 * Reads the user out of an ID token for display. This does not verify the
 * token: the API does that on every request. Never use it to decide access.
 */
export function decodeUser(idToken: string): AuthUser | null {
  try {
    const payload = idToken.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const claims = JSON.parse(decodeURIComponent(escape(json))) as Record<string, unknown>
    if (typeof claims.sub !== 'string') return null
    const text = (v: unknown) => (typeof v === 'string' && v !== '' ? v : null)
    return { sub: claims.sub, email: text(claims.email), name: text(claims.name), picture: text(claims.picture) }
  } catch {
    return null
  }
}

interface Deps {
  config?: AuthConfig
  fetch?: typeof fetch
  now?: () => number
}

/**
 * Hands out a valid ID token, refreshing it with the refresh token when it has
 * expired. Signed-out callers get null.
 */
export function createTokenManager(deps: Deps = {}) {
  const config = deps.config ?? authConfig
  const doFetch = deps.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args))
  const now = deps.now ?? Date.now
  const listeners = new Set<() => void>()
  let refreshing: Promise<Tokens | null> | null = null

  const notify = () => listeners.forEach(l => l())

  function set(tokens: Tokens | null) {
    if (tokens) saveTokens(tokens)
    else clearTokens()
    notify()
  }

  async function refresh(current: Tokens): Promise<Tokens | null> {
    if (!current.refreshToken) {
      set(null)
      return null
    }
    let res: Response
    try {
      res = await doFetch(`${config.cognitoDomain}/oauth2/token`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: config.clientId,
          refresh_token: current.refreshToken,
        }),
      })
    } catch {
      // Offline or the request failed: stay signed in and try again next time.
      return null
    }
    if (!res.ok) {
      // The refresh token was revoked or has expired: the session is over.
      if (res.status >= 400 && res.status < 500) set(null)
      return null
    }
    const next = fromResponse((await res.json()) as TokenResponse, now(), current)
    set(next)
    return next
  }

  /** Refreshes now, sharing one request between callers that ask at the same time. */
  function forceRefresh(): Promise<Tokens | null> {
    const current = loadTokens()
    if (!current) return Promise.resolve(null)
    refreshing ??= refresh(current).finally(() => { refreshing = null })
    return refreshing
  }

  async function getIdToken(): Promise<string | null> {
    const current = loadTokens()
    if (!current) return null
    if (!isExpired(current, now())) return current.idToken
    return (await forceRefresh())?.idToken ?? null
  }

  return {
    getIdToken,
    forceRefresh,
    set,
    /** The signed-in user according to the stored token, without checking expiry. */
    user: (): AuthUser | null => {
      const tokens = loadTokens()
      return tokens ? decodeUser(tokens.idToken) : null
    },
    /** Calls `listener` whenever tokens are stored or cleared. Returns an unsubscribe function. */
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

export type TokenManager = ReturnType<typeof createTokenManager>

export const tokenManager = createTokenManager()
