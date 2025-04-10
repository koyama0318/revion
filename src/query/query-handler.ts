import { ResultAsync } from 'neverthrow'
import type { AppError } from '../types/app-error'
import { createInternalServerError } from '../types/app-error'
import type {
  Query,
  QueryHandler as QueryHandlerType,
  QueryResult
} from '../types/query'

/**
 * A class that handles queries and their execution.
 */
export class QueryHandler {
  private readonly handlers: Map<string, QueryHandlerType> = new Map()

  /**
   * Registers a handler for a specific query operation.
   * @param operation The operation name to register the handler for.
   * @param handler The handler function to execute for the operation.
   */
  public register<Data = unknown>(
    operation: string,
    handler: QueryHandlerType<Data>
  ): void {
    this.handlers.set(operation, handler)
  }

  /**
   * Executes a query using the registered handler for its operation.
   * @param query The query to execute.
   * @returns A promise that resolves to the query result.
   * @throws Error if no handler is registered for the query's operation.
   */
  public async execute<Data = unknown>(
    query: Query
  ): Promise<QueryResult<Data>> {
    const handler = this.handlers.get(query.operation)
    if (!handler) {
      throw new Error(`No handler registered for operation: ${query.operation}`)
    }
    return handler(query) as Promise<QueryResult<Data>>
  }
}

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
 * Creates a query handler for a specific operation.
 * @param operation The operation name to handle.
 * @param handler The handler function to execute for the operation.
 * @returns A function that executes the handler for the given operation.
 */
export function createQueryHandler<Data = unknown>(
  operation: string,
  handler: QueryHandlerType<Data>
): (query: Query) => ResultAsync<QueryResult<Data>, AppError> {
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

    return ResultAsync.fromPromise(handler(query), (error: unknown) => {
      if (error && typeof error === 'object' && 'type' in error) {
        return error as AppError
      }
      if (error instanceof Error) {
        return createInternalServerError(error.message, { cause: error })
      }
      return createInternalServerError('Unknown error occurred')
    })
  }
}
