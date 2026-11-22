/** PKCE (RFC 7636) helpers for the authorization code flow without a client secret. */

export function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** A random URL-safe string from `byteLength` random bytes. */
export function randomString(byteLength = 32): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(byteLength)))
}

/** A new code verifier: 43 characters, the minimum the spec allows and plenty of entropy. */
export const createVerifier = () => randomString(32)

/** The S256 code challenge for a verifier. */
export async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64Url(new Uint8Array(digest))
}
