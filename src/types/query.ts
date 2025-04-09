import type { AggregateId } from './id'

export interface Query {
  operation: string
  aggregateId?: AggregateId
}

export interface QueryResult {
  data: unknown
}
