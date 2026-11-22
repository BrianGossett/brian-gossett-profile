import { describe, it, expect } from 'vitest'
import { base64Url, challengeFor, createVerifier, randomString } from '../auth/pkce'

describe('pkce', () => {
  it('computes the S256 challenge from RFC 7636 appendix B', async () => {
    expect(await challengeFor('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
  })

  it('makes verifiers of a valid length from URL-safe characters only', () => {
    const verifier = createVerifier()
    expect(verifier.length).toBeGreaterThanOrEqual(43)
    expect(verifier.length).toBeLessThanOrEqual(128)
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('makes a different verifier each time', () => {
    expect(new Set(Array.from({ length: 50 }, createVerifier)).size).toBe(50)
  })

  it('encodes base64url without +, / or padding', () => {
    expect(base64Url(new Uint8Array([251, 255, 254]))).toBe('-__-')
    expect(base64Url(new Uint8Array([1]))).toBe('AQ')
    expect(randomString(16)).toMatch(/^[A-Za-z0-9_-]+$/)
  })
})
