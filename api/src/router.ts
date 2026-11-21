import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'
import { getClaims, type Claims } from './auth'
import type { Db } from './db'
import { HttpError, json, type Response } from './http'

export interface Context {
  /** The caller's user ID: the `sub` claim of the verified token. */
  userId: string
  claims: Claims
  /** Values of `{name}` segments in the route path. */
  params: Record<string, string>
  event: APIGatewayProxyEventV2WithJWTAuthorizer
  db: Db
  now: () => Date
}

export type Handler = (ctx: Context) => Promise<Response>

export interface Route {
  method: string
  /** e.g. `/tasks/{id}/complete` */
  path: string
  handler: Handler
}

function match(pattern: string, path: string): Record<string, string> | undefined {
  const want = pattern.split('/').filter(Boolean)
  const got = path.split('/').filter(Boolean)
  if (want.length !== got.length) return undefined
  const params: Record<string, string> = {}
  for (let i = 0; i < want.length; i++) {
    const name = /^\{(\w+)\}$/.exec(want[i])?.[1]
    if (name) params[name] = decodeURIComponent(got[i])
    else if (want[i] !== got[i]) return undefined
  }
  return params
}

export function createRouter(routes: Route[], deps: { db: Db; now?: () => Date }) {
  return async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<Response> => {
    try {
      // Identity first: nothing runs for a request without a verified token.
      const claims = getClaims(event)
      const method = event.requestContext.http.method
      const path = event.rawPath
      for (const route of routes) {
        if (route.method !== method) continue
        const params = match(route.path, path)
        if (!params) continue
        return await route.handler({
          userId: claims.sub,
          claims,
          params,
          event,
          db: deps.db,
          now: deps.now ?? (() => new Date()),
        })
      }
      return json(404, { message: `No route for ${method} ${path}` })
    } catch (err) {
      if (err instanceof HttpError) return json(err.statusCode, { message: err.message })
      console.error(err)
      return json(500, { message: 'Internal error' })
    }
  }
}
