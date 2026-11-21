import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda'

export type Response = APIGatewayProxyStructuredResultV2

export function json(statusCode: number, body: unknown): Response {
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
