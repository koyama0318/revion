import { ResultAsync } from 'neverthrow'
import type { AppError } from '../types/app-error'
import type { Query, QueryResult } from '../types/query'

// export interface QueryHandler {
//   handle(query: Query): Promise<QueryResult>
// }

/**
 * Type definition for a function that handles a query and retrieves data.
 * @template Data The type of data expected in the QueryResult.
 * @param query - The query to handle.
 * @returns A ResultAsync containing the QueryResult on success, or an AppError on failure.
 */
export type HandleQueryFn<Data = unknown> = (
  query: Query
) => ResultAsync<QueryResult<Data>, AppError>

/**
 * Creates a query handler function.
 * @template Data The type of data expected in the QueryResult.
 * @param operation - The operation name this handler will handle.
 * @param handler - The function that will process the query.
 * @returns A HandleQueryFn that will handle the specified operation.
 */
export function createQueryHandler<Data = unknown>(
  operation: string,
  handler: (query: Query) => Promise<Data>
): HandleQueryFn<Data> {
  return (query: Query) => {
    if (query.operation !== operation) {
      return ResultAsync.fromPromise(
        Promise.reject(
          new Error(
            `Handler for operation ${operation} cannot handle query with operation ${query.operation}`
          )
        ),
        error => error as AppError
      )
    }

    return ResultAsync.fromPromise(
      handler(query).then(data => ({ data })),
      error => error as AppError
    )
  }
}
