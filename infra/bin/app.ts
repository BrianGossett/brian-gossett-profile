import { App } from 'aws-cdk-lib'
import { DataStack } from '../lib/data-stack'

const app = new App()

// Same region as the Amplify app. The account comes from the AWS profile in use.
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-2' }

new DataStack(app, 'ProfileData', { env })

app.synth()
