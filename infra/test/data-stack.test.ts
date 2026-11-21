import { App } from 'aws-cdk-lib'
import { Match, Template } from 'aws-cdk-lib/assertions'
import { describe, expect, it } from 'vitest'
import { DataStack } from '../lib/data-stack'

const template = Template.fromStack(new DataStack(new App(), 'TestData'))

describe('DataStack', () => {
  it('creates exactly one table', () => {
    template.resourceCountIs('AWS::DynamoDB::Table', 1)
  })

  it('uses PK and SK string keys', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: Match.arrayWith([
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
      ]),
    })
  })

  it('is provisioned at 5 reads and 5 writes', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    })
  })

  it('has one index, GSI1, keyed on GSI1PK and GSI1SK', () => {
    const [table] = Object.values(template.findResources('AWS::DynamoDB::Table'))
    const indexes = table.Properties.GlobalSecondaryIndexes
    expect(indexes).toHaveLength(1)
    expect(indexes[0]).toMatchObject({
      IndexName: 'GSI1',
      KeySchema: [
        { AttributeName: 'GSI1PK', KeyType: 'HASH' },
        { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    })
  })

  it('has point-in-time recovery on', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
    })
  })

  it('is retained when the stack is deleted', () => {
    template.hasResource('AWS::DynamoDB::Table', {
      DeletionPolicy: 'Retain',
      UpdateReplacePolicy: 'Retain',
    })
  })

  it('outputs the table name and ARN', () => {
    template.hasOutput('TableName', {})
    template.hasOutput('TableArn', {})
  })
})
