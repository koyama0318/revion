import type { AggregateId, AggregateType } from './aggregate-id'

/** Represents a query to retrieve data. */
export interface Query {
  /** The specific operation or type of data being queried. */
  readonly operation: string
  /** Optional: The type of the entity being queried. */
  readonly entityType?: string
  /** Optional: The specific ID of the entity being queried. */
  readonly entityId?: string
  /** Optional: Other query parameters or filters. */
  readonly params?: unknown
}

/**
 * Represents the result of executing a query.
 * @template Data The type of the data returned by the query.
 */
export interface QueryResult<Data = unknown> {
  /** The data retrieved by the query. */
  data: Data
}

/**
 * Represents a handler for processing queries.
 * @template Data The type of the data returned by the query.
 */
export type QueryHandler<Data = unknown> = (
  query: Query
) => Promise<QueryResult<Data>>
