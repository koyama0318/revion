import { ResultAsync } from 'neverthrow'
import type { AppError } from '../types/app-error'
import { createNotFoundError } from '../types/app-error'
import type { Query, QueryResult } from '../types/query'
import type { HandleQueryFn } from './handler'

/**
 * Represents a bus for handling queries.
 * Similar to CommandBus but for read operations.
 */
export interface QueryBus {
  /**
   * Executes a query and returns the result.
   * @param query - The query to execute.
   * @returns A ResultAsync containing the QueryResult on success, or an AppError on failure.
   */
  execute<Data = unknown>(
    query: Query
  ): ResultAsync<QueryResult<Data>, AppError>
}

/**
 * Creates a new QueryBus instance.
 * @returns A new QueryBus instance.
 */
export function createQueryBus(): QueryBus {
  const handlers = new Map<string, HandleQueryFn>()

  return {
    execute<Data = unknown>(
      query: Query
    ): ResultAsync<QueryResult<Data>, AppError> {
      const handler = handlers.get(query.operation)
      if (!handler) {
        return ResultAsync.fromPromise(
          Promise.reject(
            createNotFoundError(
              `No handler found for query operation: ${query.operation}`
            )
          ),
          error => error as AppError
        )
      }
      return handler(query) as ResultAsync<QueryResult<Data>, AppError>
    }
  }
}
