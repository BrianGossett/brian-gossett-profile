import { App } from 'aws-cdk-lib'
import { Match, Template } from 'aws-cdk-lib/assertions'
import { describe, expect, it } from 'vitest'
import { ApiStack } from '../lib/api-stack'
import { AuthStack } from '../lib/auth-stack'
import { DataStack } from '../lib/data-stack'

const env = { account: '111111111111', region: 'us-east-2' }
const siteOrigins = ['https://example.org', 'http://localhost:5173']

// Skip esbuild bundling: these tests only look at the CloudFormation template.
const app = new App({ context: { 'aws:cdk:bundling-stacks': [] } })
const data = new DataStack(app, 'TestData', { env })
const auth = new AuthStack(app, 'TestAuth', {
  env,
  domainPrefix: 'test-prefix',
  googleSecretName: 'test/google',
  siteOrigins,
})
const template = Template.fromStack(
  new ApiStack(app, 'TestApi', {
    env,
    table: data.table,
    userPool: auth.userPool,
    userPoolClient: auth.client,
    siteOrigins,
  }),
)

describe('ApiStack', () => {
  it('has one Node.js 22 Lambda that knows the table name', () => {
    template.resourceCountIs('AWS::Lambda::Function', 1)
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs22.x',
      Architectures: ['arm64'],
      Environment: { Variables: { TABLE_NAME: Match.anyValue() } },
    })
  })

  it('lets the Lambda read and write the table, and nothing wider', () => {
    const policies = Object.values(template.findResources('AWS::IAM::Policy'))
    const statements = policies.flatMap(p => p.Properties.PolicyDocument.Statement)
    const actions = statements.flatMap(s => [s.Action].flat()) as string[]
    expect(actions).toContain('dynamodb:GetItem')
    expect(actions).toContain('dynamodb:PutItem')
    expect(actions.every(a => a.startsWith('dynamodb:'))).toBe(true)
    expect(actions).not.toContain('dynamodb:*')
    expect(actions).not.toContain('dynamodb:DeleteTable')
  })

  it('has one HTTP API with a JWT authorizer for the user pool client', () => {
    template.resourceCountIs('AWS::ApiGatewayV2::Api', 1)
    template.resourceCountIs('AWS::ApiGatewayV2::Authorizer', 1)
    template.hasResourceProperties('AWS::ApiGatewayV2::Authorizer', {
      AuthorizerType: 'JWT',
      IdentitySource: ['$request.header.Authorization'],
      JwtConfiguration: { Audience: Match.anyValue(), Issuer: Match.anyValue() },
    })
  })

  it('requires the authorizer on every route', () => {
    const routes = Object.values(template.findResources('AWS::ApiGatewayV2::Route'))
    expect(routes.length).toBeGreaterThan(0)
    for (const route of routes) {
      expect(route.Properties.AuthorizationType).toBe('JWT')
      expect(route.Properties.AuthorizerId).toBeDefined()
    }
  })

  it('routes every path to the Lambda but leaves OPTIONS to API Gateway', () => {
    const keys = Object.values(template.findResources('AWS::ApiGatewayV2::Route'))
      .map(r => r.Properties.RouteKey as string)
      .sort()
    expect(keys).toEqual([
      'DELETE /{proxy+}',
      'GET /{proxy+}',
      'PATCH /{proxy+}',
      'POST /{proxy+}',
      'PUT /{proxy+}',
    ])
  })

  it('allows CORS only from the site origins', () => {
    template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
      CorsConfiguration: {
        AllowOrigins: siteOrigins,
        AllowHeaders: ['authorization', 'content-type'],
      },
    })
  })

  it('expires logs after a month', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', { RetentionInDays: 30 })
  })

  it('outputs the API URL', () => {
    template.hasOutput('ApiUrl', {})
  })
})
