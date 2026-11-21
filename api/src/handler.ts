import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'

// Single Lambda behind the HTTP API. Routes are added in step 7.
export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  return {
    statusCode: 404,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: `No route for ${event.routeKey}` }),
  }
}
