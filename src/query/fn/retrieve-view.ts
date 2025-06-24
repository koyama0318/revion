import type {
  AppError,
  AsyncResult,
  GetListOptions,
  Query,
  QueryDefinition,
  QueryMap,
  QueryResolverFn,
  QueryResult,
  View,
  ViewMap
} from '../../types'
import { err, ok, toAsyncResult } from '../../utils'
import type { QueryHandlerDeps } from '../query-handler'

export type RetrieveViewFn = (query: Query) => AsyncResult<QueryResult, AppError>

type QueryParam<QM> = QM[keyof QM] extends QueryDefinition<
  infer Q extends Query,
  infer _R extends QueryResult
>
  ? Q
  : never

export function createRetrieveViewFnFactory<
  QM extends QueryMap,
  V extends ViewMap,
  D extends QueryHandlerDeps
>(resolver: QueryResolverFn<QM, V>): (deps: D) => RetrieveViewFn {
  return (deps: D) => {
    return async (query: Query): AsyncResult<QueryResult, AppError> => {
      const operation = query.operation
      const queryFn = resolver[operation as keyof QM]
      if (!queryFn) {
        return err({
          code: 'INVALID_OPERATION',
          message: `Operation ${operation} not found`
        })
      }

      const result: QueryResult = {}
      for (const [resultKey, def] of Object.entries(queryFn)) {
        // getList
        if ('view' in def && 'options' in def && 'options' in query) {
          const options = def.options(query as unknown as QueryParam<QM>)
          const view = await toAsyncResult(() =>
            deps.readDatabase.getList(def.view, options as GetListOptions<View>)
          )
          if (!view.ok) {
            return err({
              code: 'READ_DATABASE_ERROR',
              message: 'Failed to retrieve view list',
              cause: view.error
            })
          }
          result[resultKey] = view.value
          continue
        }

        // getById
        if ('view' in def && 'id' in def && 'id' in query) {
          const id = def.id(query as unknown as QueryParam<QM>)
          const view = await toAsyncResult(() => deps.readDatabase.getById(def.view, id))
          if (!view.ok) {
            return err({
              code: 'READ_DATABASE_ERROR',
              message: 'Failed to retrieve view by id',
              cause: view.error
            })
          }
          if (!view.value) {
            return err({
              code: 'VIEW_NOT_FOUND',
              message: `View not found: ${def.view}#${id}`
            })
          }
          result[resultKey] = view.value
          continue
        }

        return err({
          code: 'INVALID_QUERY',
          message: `Invalid query: ${JSON.stringify(query)}`
        })
      }

      return ok(result)
    }
  }
}
