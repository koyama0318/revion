import type { AppError } from '../types/error'
import type { QueryHandler, QueryHandlerFactory } from '../types/query'
import type { Query, QueryResult } from '../types/query'
import type { ReadStorage } from '../types/read-storage'
import type { AsyncResult } from '../utils/result'

export const createQueryHandler = <Q extends Query, QR extends QueryResult>(
  processor: (readStorage: ReadStorage, query: Q) => AsyncResult<QR, AppError>
): QueryHandlerFactory => {
  return (readStorage: ReadStorage): QueryHandler => {
    return async (query: Query): AsyncResult<QR, AppError> => {
      return processor(readStorage, query as Q)
    }
  }
}
