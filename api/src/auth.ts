import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'
import { HttpError } from './http'

export interface Claims {
  sub: string
  email?: string
  name?: string
  picture?: string
}

/**
 * The caller's identity, taken only from the JWT the API Gateway authorizer
 * already verified. Never read a user ID from the path, query or body.
 */
export function getClaims(event: APIGatewayProxyEventV2WithJWTAuthorizer): Claims {
  const claims = event.requestContext?.authorizer?.jwt?.claims
  const sub = claims?.sub
  if (typeof sub !== 'string' || sub === '') throw new HttpError(401, 'Unauthorized')
  const str = (v: unknown) => (typeof v === 'string' && v !== '' ? v : undefined)
  return { sub, email: str(claims.email), name: str(claims.name), picture: str(claims.picture) }
}
