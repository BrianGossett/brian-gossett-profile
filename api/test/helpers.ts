import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'
import type { Db, Item } from '../src/db'

export function memoryDb(): Db & { items: Map<string, Item> } {
  const items = new Map<string, Item>()
  const key = (pk: string, sk: string) => `${pk}|${sk}`
  return {
    items,
    async get(pk, sk) {
      return items.get(key(pk, sk))
    },
    async putIfAbsent(item) {
      const k = key(item.PK, item.SK)
      if (items.has(k)) return false
      items.set(k, item)
      return true
    },
  }
}

interface EventOptions {
  claims?: Record<string, unknown> | null
  body?: unknown
  query?: Record<string, string>
}

export function makeEvent(method: string, path: string, opts: EventOptions = {}): APIGatewayProxyEventV2WithJWTAuthorizer {
  const claims = opts.claims === undefined ? { sub: 'user-1', email: 'a@example.com', name: 'Ada' } : opts.claims
  return {
    version: '2.0',
    routeKey: `${method} /{proxy+}`,
    rawPath: path,
    rawQueryString: new URLSearchParams(opts.query).toString(),
    queryStringParameters: opts.query,
    headers: {},
    isBase64Encoded: false,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    requestContext: {
      http: { method, path, protocol: 'HTTP/1.1', sourceIp: '127.0.0.1', userAgent: 'test' },
      ...(claims ? { authorizer: { jwt: { claims, scopes: [] } } } : {}),
    },
  } as unknown as APIGatewayProxyEventV2WithJWTAuthorizer
}

export const body = (res: { body?: string }) => JSON.parse(res.body ?? 'null')
