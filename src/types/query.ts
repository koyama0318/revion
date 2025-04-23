import type { AsyncResult } from '../utils/result'
import type { AppError } from './error'
import type { ReadStorage } from './read-storage'

export type Query = { type: string } | { type: string; id: string }

export type QueryResult = unknown

export type QueryHandler = (query: Query) => AsyncResult<QueryResult, AppError>

export type QueryHandlerFactory = (storage: ReadStorage) => QueryHandler
