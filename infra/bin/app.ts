import { App } from 'aws-cdk-lib'
import { AuthStack } from '../lib/auth-stack'
import { DataStack } from '../lib/data-stack'

const app = new App()

// Same region as the Amplify app. The account comes from the AWS profile in use.
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-2' }

// Every address the site is served from, plus local dev. See infra/README.md.
const siteOrigins = [
  'https://briangossett.org',
  'https://www.briangossett.org',
  'https://master.d3ksz8q52usvuz.amplifyapp.com',
  'http://localhost:5173',
]

new DataStack(app, 'ProfileData', { env })

new AuthStack(app, 'ProfileAuth', {
  env,
  domainPrefix: 'briangossett',
  googleSecretName: 'profile/google-oauth',
  siteOrigins,
})

app.synth()
