import type { AppError, AsyncResult } from '../types'
import type { Query, QueryMap } from '../types/query'
import { err } from '../utils'
import { type QueryHandlerDeps, createQueryHandlers } from './query-handler'
import type { AnyQueryResolver } from './query-resolver'

type QueryBus = <Q extends Query, QM extends QueryMap>(
  query: Q
) => AsyncResult<QM[Q['operation']]['result'], AppError>

export function createQueryBus<QM extends QueryMap>(
  deps: QueryHandlerDeps,
  resolvers: AnyQueryResolver[]
): QueryBus {
  const handlers = createQueryHandlers(deps, resolvers)

  const opToType: Record<string, string> = {}
  for (const resolver of resolvers) {
    for (const key of Object.keys(resolver.resolver)) {
      if (opToType[key]) {
        const val = opToType[key]
        throw new Error(
          `Duplicate query key: ${resolver.type}.${key}, already defined by ${val}.${key}`
        )
      }
      opToType[key] = resolver.type
    }
  }

  return async <Q extends Query>(query: Q): AsyncResult<QM[Q['operation']]['result'], AppError> => {
    const handlerType = opToType[query.operation]
    if (!handlerType) {
      return err({
        code: 'QUERY_HANDLER_NOT_FOUND',
        message: `Operation ${query.operation} not found`
      })
    }

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    return handlers[handlerType]!(query)
  }
}
