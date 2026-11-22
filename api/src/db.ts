import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
  type TransactWriteCommandInput,
} from '@aws-sdk/lib-dynamodb'

export type Item = Record<string, unknown> & { PK: string; SK: string }

/** One write inside an all-or-nothing transaction. */
export type TxOp =
  /** Writes the item. `ifAbsent` fails the transaction if an item with its key already exists. */
  | { type: 'put'; item: Item; ifAbsent?: boolean }
  /**
   * Adds `amount` (may be negative) to a number field. With `min`, the transaction
   * fails unless the result would be at least `min`.
   */
  | { type: 'add'; pk: string; sk: string; field: string; amount: number; min?: number }
  | { type: 'delete'; pk: string; sk: string }

/** A transaction was rejected because one of its conditions did not hold. */
export class ConditionFailedError extends Error {
  constructor() {
    super('Condition failed')
  }
}

export interface Range {
  /** Sort keys that start with this. */
  prefix?: string
  /** Sort keys from `from` to `to`, inclusive. */
  from?: string
  to?: string
}

/** The table operations handlers use. Tests swap in an in-memory version. */
export interface Db {
  get(pk: string, sk: string): Promise<Item | undefined>
  put(item: Item): Promise<void>
  /** Writes the item only if no item has its key yet. Returns false if one already existed. */
  putIfAbsent(item: Item): Promise<boolean>
  delete(pk: string, sk: string): Promise<void>
  /** Items in one partition, in sort-key order. */
  query(pk: string, range: Range): Promise<Item[]>
  /** Applies every write or none. Throws ConditionFailedError if a condition fails. */
  transact(ops: TxOp[]): Promise<void>
}

export const userKey = (userId: string) => `USER#${userId}`
export const householdKey = (householdId: string) => `HH#${householdId}`

export function createDynamoDb(tableName: string): Db {
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: { removeUndefinedValues: true },
  })
  const TableName = tableName

  return {
    async get(pk, sk) {
      const res = await client.send(new GetCommand({ TableName, Key: { PK: pk, SK: sk } }))
      return res.Item as Item | undefined
    },

    async put(item) {
      await client.send(new PutCommand({ TableName, Item: item }))
    },

    async putIfAbsent(item) {
      try {
        await client.send(new PutCommand({
          TableName,
          Item: item,
          ConditionExpression: 'attribute_not_exists(PK)',
        }))
        return true
      } catch (err) {
        if ((err as Error).name === 'ConditionalCheckFailedException') return false
        throw err
      }
    },

    async delete(pk, sk) {
      await client.send(new DeleteCommand({ TableName, Key: { PK: pk, SK: sk } }))
    },

    async query(pk, range) {
      const byRange = range.from !== undefined && range.to !== undefined
      const items: Item[] = []
      let ExclusiveStartKey: Record<string, unknown> | undefined
      do {
        const res = await client.send(new QueryCommand({
          TableName,
          // DynamoDB rejects begins_with on an empty string, so no prefix means the whole partition.
          KeyConditionExpression: byRange
            ? 'PK = :pk AND SK BETWEEN :from AND :to'
            : range.prefix
              ? 'PK = :pk AND begins_with(SK, :prefix)'
              : 'PK = :pk',
          ExpressionAttributeValues: byRange
            ? { ':pk': pk, ':from': range.from, ':to': range.to }
            : range.prefix
              ? { ':pk': pk, ':prefix': range.prefix }
              : { ':pk': pk },
          ExclusiveStartKey,
        }))
        items.push(...((res.Items ?? []) as Item[]))
        ExclusiveStartKey = res.LastEvaluatedKey
      } while (ExclusiveStartKey)
      return items
    },

    async transact(ops) {
      const TransactItems: NonNullable<TransactWriteCommandInput['TransactItems']> = ops.map(op => {
        if (op.type === 'put') {
          return {
            Put: {
              TableName,
              Item: op.item,
              ...(op.ifAbsent ? { ConditionExpression: 'attribute_not_exists(PK)' } : {}),
            },
          }
        }
        if (op.type === 'delete') return { Delete: { TableName, Key: { PK: op.pk, SK: op.sk } } }
        return {
          Update: {
            TableName,
            Key: { PK: op.pk, SK: op.sk },
            UpdateExpression: 'ADD #f :amount',
            ExpressionAttributeNames: { '#f': op.field },
            ExpressionAttributeValues: {
              ':amount': op.amount,
              // result >= min  <=>  current >= min - amount
              ...(op.min !== undefined ? { ':need': op.min - op.amount } : {}),
            },
            ...(op.min !== undefined ? { ConditionExpression: '#f >= :need' } : {}),
          },
        }
      })
      try {
        await client.send(new TransactWriteCommand({ TransactItems }))
      } catch (err) {
        if ((err as Error).name === 'TransactionCanceledException') throw new ConditionFailedError()
        throw err
      }
    },
  }
}
