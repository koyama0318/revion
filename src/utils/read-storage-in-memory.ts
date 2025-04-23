import type { AppError } from '../types/error'
import type { ReadStorage, View } from '../types/read-storage'
import type { AsyncResult } from './result'
import { err, ok } from './result'

export class ReadStorageInMemory implements ReadStorage {
  readonly views: Record<string, View[]> = {}

  async getList<T extends View>(type: string): AsyncResult<T[], AppError> {
    const views = this.views[type] as T[]
    return ok(views ?? [])
  }

  async getById<T extends View>(type: string, id: string): AsyncResult<T, AppError> {
    const view = this.views[type]?.find(v => v.id === id) as T | null
    if (!view) {
      return err({
        code: 'VIEW_NOT_FOUND',
        message: `View with id ${id} not found`
      })
    }
    return ok(view)
  }

  async save<T extends View>(data: T): AsyncResult<void, AppError> {
    if (!this.views[data.type]) {
      this.views[data.type] = []
    }
    this.views[data.type].push(data)
    return ok(undefined)
  }

  async delete(type: string, id: string): AsyncResult<void, AppError> {
    return ok(undefined)
  }
}
