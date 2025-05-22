import type { AppError, AsyncResult, ReadDatabase, ViewMap } from '../types'
import type { Query, QueryMap, QueryResult } from '../types/query'
import { ok } from '../utils'
import { createRetrieveViewFnFactory } from './fn/retrieve-view'
import type { AnyQueryResolver, QueryResolver } from './query-resolver'

export type QueryHandlerDeps = {
  readDatabase: ReadDatabase
}

export type QueryHandler = (query: Query) => AsyncResult<QueryResult, AppError>

type QueryHandlerFactory<D extends QueryHandlerDeps = QueryHandlerDeps> = (deps: D) => QueryHandler

function createQueryHandlerFactory<
  T extends string,
  Q extends QueryMap,
  V extends ViewMap,
  D extends QueryHandlerDeps
>(resolver: QueryResolver<T, Q, V>): QueryHandlerFactory<D> {
  return (deps: D) => {
    const retrieveViewFn = createRetrieveViewFnFactory<Q, V, D>(resolver.resolver)(deps)

    return async (query: Query): AsyncResult<QueryResult, AppError> => {
      const retrieved = await retrieveViewFn(query)
      if (!retrieved.ok) return retrieved

      return ok(retrieved.value)
    }
  }
}

export function createQueryHandlers(
  deps: QueryHandlerDeps,
  resolvers: AnyQueryResolver[]
): Record<string, QueryHandler> {
  const handlers: Record<string, QueryHandler> = {}

  for (const resolver of resolvers) {
    handlers[resolver.type] = createQueryHandlerFactory(resolver)(deps)
  }

  return handlers
}
