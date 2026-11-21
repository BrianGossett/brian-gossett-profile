import { CfnOutput, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib'
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb'
import type { Construct } from 'constructs'

// Single-table design. Key layout is documented in infra/README.md.
export class DataStack extends Stack {
  readonly table: Table

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    this.table = new Table(this, 'Table', {
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      billingMode: BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      // The table outlives the stack: deleting the stack leaves the data in place.
      removalPolicy: RemovalPolicy.RETAIN,
    })

    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: { name: 'GSI1PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: AttributeType.STRING },
      readCapacity: 5,
      writeCapacity: 5,
    })

    new CfnOutput(this, 'TableName', { value: this.table.tableName })
    new CfnOutput(this, 'TableArn', { value: this.table.tableArn })
  }
}
