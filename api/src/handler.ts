import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'
import { createDynamoDb } from './db'
import type { Response } from './http'
import { createRouter } from './router'
import { routes } from './routes'

// Single Lambda behind the HTTP API. Every route requires a Cognito token.
let router: ReturnType<typeof createRouter> | undefined

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<Response> => {
  if (!router) {
    const tableName = process.env.TABLE_NAME
    if (!tableName) throw new Error('TABLE_NAME is not set')
    router = createRouter(routes, { db: createDynamoDb(tableName) })
  }
  return router(event)
}
