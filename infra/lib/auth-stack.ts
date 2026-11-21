import { CfnOutput, CfnParameter, SecretValue, Stack, type StackProps } from 'aws-cdk-lib'
import {
  FeaturePlan,
  OAuthScope,
  ProviderAttribute,
  UserPool,
  UserPoolClient,
  UserPoolClientIdentityProvider,
  UserPoolIdentityProviderGoogle,
} from 'aws-cdk-lib/aws-cognito'
import type { Construct } from 'constructs'

export interface AuthStackProps extends StackProps {
  /** Prefix of the hosted sign-in domain: <prefix>.auth.<region>.amazoncognito.com */
  domainPrefix: string
  /** Site origins that may start sign-in. Sign-in returns to <origin>/todo. */
  siteOrigins: string[]
}

export class AuthStack extends Stack {
  readonly userPool: UserPool
  readonly client: UserPoolClient

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props)

    // Google is the only way in: no passwords, no self sign-up.
    // Lite is the cheapest feature plan and covers hosted sign-in with Google.
    this.userPool = new UserPool(this, 'UserPool', {
      selfSignUpEnabled: false,
      featurePlan: FeaturePlan.LITE,
    })

    // The Google OAuth client is passed in at deploy time (see scripts/deploy-auth.sh),
    // so neither value is ever written to the template or the repo.
    const googleClientId = new CfnParameter(this, 'GoogleClientId', {
      description: 'Google OAuth client ID',
      allowedPattern: '^[0-9A-Za-z_.-]+\\.apps\\.googleusercontent\\.com$',
      constraintDescription: 'must be a Google client ID with no quotes or spaces',
    })
    const googleClientSecret = new CfnParameter(this, 'GoogleClientSecret', {
      description: 'Google OAuth client secret',
      noEcho: true,
      minLength: 1,
    })

    const google = new UserPoolIdentityProviderGoogle(this, 'Google', {
      userPool: this.userPool,
      clientId: googleClientId.valueAsString,
      clientSecretValue: SecretValue.cfnParameter(googleClientSecret),
      scopes: ['openid', 'email', 'profile'],
      attributeMapping: {
        email: ProviderAttribute.GOOGLE_EMAIL,
        fullname: ProviderAttribute.GOOGLE_NAME,
        profilePicture: ProviderAttribute.GOOGLE_PICTURE,
      },
    })

    const domain = this.userPool.addDomain('Domain', {
      cognitoDomain: { domainPrefix: props.domainPrefix },
    })

    const todoUrls = props.siteOrigins.map(origin => `${origin}/todo`)

    // Public client for the browser app: authorization code flow, used with PKCE, no secret.
    this.client = this.userPool.addClient('WebClient', {
      generateSecret: false,
      supportedIdentityProviders: [UserPoolClientIdentityProvider.GOOGLE],
      authFlows: {},
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE],
        callbackUrls: todoUrls,
        logoutUrls: todoUrls,
      },
    })
    this.client.node.addDependency(google)

    new CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId })
    new CfnOutput(this, 'UserPoolClientId', { value: this.client.userPoolClientId })
    new CfnOutput(this, 'HostedUiDomain', { value: domain.baseUrl() })
    new CfnOutput(this, 'GoogleRedirectUri', { value: `${domain.baseUrl()}/oauth2/idpresponse` })
  }
}
