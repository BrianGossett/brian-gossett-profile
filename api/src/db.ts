import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'

export type Item = Record<string, unknown> & { PK: string; SK: string }

/** The table operations handlers use. Tests swap in an in-memory version. */
export interface Db {
  get(pk: string, sk: string): Promise<Item | undefined>
  /** Writes the item only if no item has its key yet. Returns false if one already existed. */
  putIfAbsent(item: Item): Promise<boolean>
}

export const userKey = (userId: string) => `USER#${userId}`

export function createDynamoDb(tableName: string): Db {
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({}))
  return {
    async get(pk, sk) {
      const res = await client.send(new GetCommand({ TableName: tableName, Key: { PK: pk, SK: sk } }))
      return res.Item as Item | undefined
    },
    async putIfAbsent(item) {
      try {
        await client.send(new PutCommand({
          TableName: tableName,
          Item: item,
          ConditionExpression: 'attribute_not_exists(PK)',
        }))
        return true
      } catch (err) {
        if ((err as Error).name === 'ConditionalCheckFailedException') return false
        throw err
      }
    },
  }
}
