import { authConfig, type AuthConfig } from '../auth/config'
import { tokenManager, type TokenManager } from '../auth/tokens'

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

interface Options {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string>
}

interface Deps {
  config?: AuthConfig
  fetch?: typeof fetch
  tokens?: TokenManager
}

/** Calls the API as the signed-in user. Throws ApiError (status 401 when signed out). */
export function createApiClient(deps: Deps = {}) {
  const config = deps.config ?? authConfig
  const doFetch = deps.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args))
  const tokens = deps.tokens ?? tokenManager

  return async function api<T = unknown>(path: string, options: Options = {}): Promise<T> {
    const query = options.query ? `?${new URLSearchParams(options.query)}` : ''
    const send = (token: string) =>
      doFetch(`${config.apiUrl}${path}${query}`, {
        method: options.method ?? 'GET',
        headers: {
          authorization: `Bearer ${token}`,
          ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      })

    let token = await tokens.getIdToken()
    if (!token) throw new ApiError(401, 'Not signed in')
    let res = await send(token)
    if (res.status === 401) {
      // The token may have been rejected early (clock drift): renew it once and retry.
      token = (await tokens.forceRefresh())?.idToken ?? null
      if (!token) throw new ApiError(401, 'Not signed in')
      res = await send(token)
    }
    if (res.status === 204) return undefined as T
    const data = (await res.json().catch(() => null)) as { message?: string } | null
    if (!res.ok) throw new ApiError(res.status, data?.message ?? `Request failed (${res.status})`)
    return data as T
  }
}

export const api = createApiClient()
