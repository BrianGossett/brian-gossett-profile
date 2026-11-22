import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'
import { ConditionFailedError, type Db, type Item, type TxOp } from '../src/db'

export function memoryDb(): Db & { items: Map<string, Item> } {
  const items = new Map<string, Item>()
  const key = (pk: string, sk: string) => `${pk}|${sk}`
  const copy = <T>(v: T): T => (v === undefined ? v : structuredClone(v))
  return {
    items,
    async get(pk, sk) {
      return copy(items.get(key(pk, sk)))
    },
    async put(item) {
      items.set(key(item.PK, item.SK), copy(item))
    },
    async putIfAbsent(item) {
      const k = key(item.PK, item.SK)
      if (items.has(k)) return false
      items.set(k, copy(item))
      return true
    },
    async delete(pk, sk) {
      items.delete(key(pk, sk))
    },
    async query(pk, range) {
      const byRange = range.from !== undefined && range.to !== undefined
      return [...items.values()]
        .filter(i => i.PK === pk)
        .filter(i => (byRange ? i.SK >= range.from! && i.SK <= range.to! : i.SK.startsWith(range.prefix ?? '')))
        .sort((a, b) => (a.SK < b.SK ? -1 : a.SK > b.SK ? 1 : 0))
        .map(copy)
    },
    async transact(ops: TxOp[]) {
      // Check every condition before changing anything, so it is all-or-nothing.
      for (const op of ops) {
        if (op.type === 'put' && op.ifAbsent && items.has(key(op.item.PK, op.item.SK))) throw new ConditionFailedError()
        if (op.type === 'add' && op.min !== undefined) {
          const current = items.get(key(op.pk, op.sk))?.[op.field]
          if (typeof current !== 'number' || current + op.amount < op.min) throw new ConditionFailedError()
        }
      }
      for (const op of ops) {
        if (op.type === 'put') items.set(key(op.item.PK, op.item.SK), copy(op.item))
        else if (op.type === 'delete') items.delete(key(op.pk, op.sk))
        else {
          const k = key(op.pk, op.sk)
          const item: Item = items.get(k) ?? { PK: op.pk, SK: op.sk }
          items.set(k, { ...item, [op.field]: ((item[op.field] as number | undefined) ?? 0) + op.amount })
        }
      }
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
