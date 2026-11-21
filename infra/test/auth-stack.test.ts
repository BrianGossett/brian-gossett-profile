import { App } from 'aws-cdk-lib'
import { Match, Template } from 'aws-cdk-lib/assertions'
import { describe, expect, it } from 'vitest'
import { AuthStack } from '../lib/auth-stack'

const template = Template.fromStack(
  new AuthStack(new App(), 'TestAuth', {
    env: { account: '111111111111', region: 'us-east-2' },
    domainPrefix: 'test-prefix',
    siteOrigins: ['https://example.org', 'http://localhost:5173'],
  }),
)

const clientProps = () =>
  Object.values(template.findResources('AWS::Cognito::UserPoolClient'))[0].Properties

describe('AuthStack', () => {
  it('creates one user pool with self sign-up off, on the Lite plan', () => {
    template.resourceCountIs('AWS::Cognito::UserPool', 1)
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      AdminCreateUserConfig: { AllowAdminCreateUserOnly: true },
      UserPoolTier: 'LITE',
    })
  })

  it('has Google as its only identity provider', () => {
    template.resourceCountIs('AWS::Cognito::UserPoolIdentityProvider', 1)
    template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
      ProviderName: 'Google',
      ProviderType: 'Google',
    })
    expect(clientProps().SupportedIdentityProviders).toEqual(['Google'])
  })

  it('takes the Google client ID and secret as deploy parameters, with the secret hidden', () => {
    template.hasParameter('GoogleClientId', { Type: 'String' })
    template.hasParameter('GoogleClientSecret', { Type: 'String', NoEcho: true })
    template.hasResourceProperties('AWS::Cognito::UserPoolIdentityProvider', {
      ProviderDetails: {
        client_id: { Ref: 'GoogleClientId' },
        client_secret: { Ref: 'GoogleClientSecret' },
      },
    })
  })

  it('rejects a client ID saved with quotes around it', () => {
    const pattern = new RegExp(template.findParameters('GoogleClientId').GoogleClientId.AllowedPattern)
    expect(pattern.test('123-abc.apps.googleusercontent.com')).toBe(true)
    expect(pattern.test('"123-abc.apps.googleusercontent.com"')).toBe(false)
  })

  it('has a hosted sign-in domain', () => {
    template.hasResourceProperties('AWS::Cognito::UserPoolDomain', { Domain: 'test-prefix' })
  })

  it('has a web client with code flow only and no secret', () => {
    template.resourceCountIs('AWS::Cognito::UserPoolClient', 1)
    template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      GenerateSecret: false,
      AllowedOAuthFlows: ['code'],
      AllowedOAuthFlowsUserPoolClient: true,
      AllowedOAuthScopes: Match.arrayWith(['openid', 'email', 'profile']),
    })
  })

  it('does not allow password sign-in on the client', () => {
    const flows: string[] = clientProps().ExplicitAuthFlows ?? []
    expect(flows.filter(f => f.includes('PASSWORD') || f.includes('SRP'))).toEqual([])
  })

  it('returns to /todo on every site origin, for sign-in and sign-out', () => {
    const expected = ['https://example.org/todo', 'http://localhost:5173/todo']
    expect(clientProps().CallbackURLs).toEqual(expected)
    expect(clientProps().LogoutURLs).toEqual(expected)
  })

  it('outputs what the app and the Google client need', () => {
    for (const name of ['UserPoolId', 'UserPoolClientId', 'HostedUiDomain', 'GoogleRedirectUri']) {
      template.hasOutput(name, {})
    }
  })
})
