import type { AppError } from '../types/error'
import type { Query, QueryHandler, QueryResult } from '../types/query'
import { err } from '../utils/result'
import type { AsyncResult } from '../utils/result'

export class QueryBus {
  constructor(private readonly handlers: Record<string, QueryHandler>) {}

  async execute(query: Query): AsyncResult<QueryResult, AppError> {
    const handler = this.handlers[query.type]
    if (!handler) {
      return err({
        code: 'HANDLER_NOT_FOUND',
        message: `Query handler for query ${query.type} not found`
      })
    }

    return handler(query)
  }
}
