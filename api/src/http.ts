import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'

export type Response = APIGatewayProxyStructuredResultV2

export function json(statusCode: number, body: unknown): Response {
  if (statusCode === 204) return { statusCode }
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }
}

/** Thrown by handlers to return an error status with a message. */
export class HttpError extends Error {
  constructor(readonly statusCode: number, message: string) {
    super(message)
  }
}

/** The request body as a JSON object. Throws 400 for anything else. */
export function parseBody(event: Pick<APIGatewayProxyEventV2, 'body' | 'isBase64Encoded'>): Record<string, unknown> {
  if (!event.body) throw new HttpError(400, 'A JSON body is required')
  try {
    const text = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body
    const parsed: unknown = JSON.parse(text)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
    return parsed as Record<string, unknown>
  } catch {
    throw new HttpError(400, 'The body must be a JSON object')
  }
}

/** A trimmed, non-empty string no longer than `max`, or a 400. */
export function requireText(value: unknown, field: string, max = 200): string {
  if (typeof value !== 'string' || value.trim() === '') throw new HttpError(400, `${field} is required`)
  const text = value.trim()
  if (text.length > max) throw new HttpError(400, `${field} must be at most ${max} characters`)
  return text
}
