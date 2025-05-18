import type { AppError } from './app-error'
import type { AsyncResult } from './result'
import type { ViewMap } from './view'

export type GetListOptions<T> = {
  limit?: number
  offset?: number
  sortBy?: keyof T & string
  sortOrder?: 'asc' | 'desc'
  filter?: Partial<T>
}

export type ReadDatabase = {
  getList<K extends keyof ViewMap, T extends GetListOptions<ViewMap[K]>>(
    type: K,
    options: T
  ): AsyncResult<ViewMap[K][], AppError>
  getById<K extends keyof ViewMap>(type: K, id: string): AsyncResult<ViewMap[K], AppError>
  save<K extends keyof ViewMap>(type: K, data: ViewMap[K]): AsyncResult<void, AppError>
  delete<K extends keyof ViewMap>(type: K, id: string): AsyncResult<void, AppError>
}
