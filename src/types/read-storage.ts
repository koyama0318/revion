import type { AsyncResult } from '../utils/result'
import type { AppError } from './error'

export type View = {
  type: string
  id: string
  [key: string]: unknown
}

export interface ReadStorage {
  getList<T extends View>(type: string): AsyncResult<T[], AppError>
  getById<T extends View>(type: string, id: string): AsyncResult<T, AppError>
  save<T extends View>(data: T): AsyncResult<void, AppError>
  delete(type: string, id: string): AsyncResult<void, AppError>
}
