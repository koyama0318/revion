import type { ResultAsync } from 'neverthrow'
import type { AppError } from '../types/app-error'
import type { Query, QueryResult } from '../types/query'

// export interface QueryHandler {
//   handle(query: Query): Promise<QueryResult>
// }

export type HandleQueryFn = (query: Query) => ResultAsync<QueryResult, AppError>
