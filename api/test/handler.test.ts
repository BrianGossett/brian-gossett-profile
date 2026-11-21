import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'
import { handler } from '../src/handler'

describe('handler', () => {
  it('returns 404 for an unknown route', async () => {
    const event = { routeKey: 'GET /nope' } as APIGatewayProxyEventV2WithJWTAuthorizer
    const res = await handler(event)
    expect(res).toMatchObject({ statusCode: 404 })
  })
})
