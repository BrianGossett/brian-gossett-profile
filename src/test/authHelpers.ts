import type { AuthConfig } from '../auth/config'

export const config: AuthConfig = {
  apiUrl: 'https://api.test',
  cognitoDomain: 'https://auth.test',
  clientId: 'client-123',
}

const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

/** An unsigned token with the given claims, shaped like a Cognito ID token. */
export const fakeIdToken = (claims: Record<string, unknown>) => `${b64({ alg: 'none' })}.${b64(claims)}.sig`

export const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
