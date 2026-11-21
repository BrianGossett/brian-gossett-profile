import { App } from 'aws-cdk-lib'

// Stacks (data, auth, api) are added in later steps.
const app = new App()

app.synth()
