import { fileURLToPath } from 'node:url'
import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib'
import { CorsHttpMethod, HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import type { IUserPool, IUserPoolClient } from 'aws-cdk-lib/aws-cognito'
import type { ITable } from 'aws-cdk-lib/aws-dynamodb'
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import type { Construct } from 'constructs'

export interface ApiStackProps extends StackProps {
  table: ITable
  userPool: IUserPool
  userPoolClient: IUserPoolClient
  /** Browser origins allowed to call the API. */
  siteOrigins: string[]
}

const apiDir = fileURLToPath(new URL('../../api/', import.meta.url))

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props)

    const fn = new NodejsFunction(this, 'Handler', {
      entry: `${apiDir}src/handler.ts`,
      depsLockFilePath: `${apiDir}package-lock.json`,
      projectRoot: apiDir,
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      memorySize: 256,
      timeout: Duration.seconds(10),
      environment: { TABLE_NAME: props.table.tableName },
      // The AWS SDK ships with the Lambda runtime; leaving it out keeps the bundle small.
      bundling: { externalModules: ['@aws-sdk/*'] },
      // Logs are kept for a month, then deleted, so they never pile up.
      logGroup: new LogGroup(this, 'HandlerLogs', {
        retention: RetentionDays.ONE_MONTH,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
    })
    props.table.grantReadWriteData(fn)

    const api = new HttpApi(this, 'Api', {
      corsPreflight: {
        allowOrigins: props.siteOrigins,
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.PATCH,
          CorsHttpMethod.DELETE,
        ],
        allowHeaders: ['authorization', 'content-type'],
        maxAge: Duration.hours(1),
      },
    })

    // One catch-all route: every path needs a valid Cognito token (401 without one),
    // and the Lambda's own router answers 404 for paths it doesn't know.
    // OPTIONS is left out so API Gateway answers CORS preflights itself.
    api.addRoutes({
      path: '/{proxy+}',
      methods: [HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE],
      integration: new HttpLambdaIntegration('HandlerIntegration', fn),
      authorizer: new HttpUserPoolAuthorizer('CognitoAuthorizer', props.userPool, {
        userPoolClients: [props.userPoolClient],
      }),
    })

    new CfnOutput(this, 'ApiUrl', { value: api.apiEndpoint })
  }
}
