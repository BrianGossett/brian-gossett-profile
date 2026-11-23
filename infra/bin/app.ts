import { App } from 'aws-cdk-lib'
import { ApiStack } from '../lib/api-stack'
import { AuthStack } from '../lib/auth-stack'
import { BudgetStack } from '../lib/budget-stack'
import { DataStack } from '../lib/data-stack'
import { FilesStack } from '../lib/files-stack'

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

const data = new DataStack(app, 'ProfileData', { env })

const auth = new AuthStack(app, 'ProfileAuth', {
  env,
  domainPrefix: 'briangossett',
  siteOrigins,
})

new ApiStack(app, 'ProfileApi', {
  env,
  table: data.table,
  userPool: auth.userPool,
  userPoolClient: auth.client,
  siteOrigins,
})

// Score PDFs for Exam Prep. Independent of the other stacks.
new FilesStack(app, 'ProfileFiles', { env })

// A monthly cost alert for the whole account. Deployed with an email address:
// see infra/README.md.
new BudgetStack(app, 'ProfileBudget', { env })

app.synth()
