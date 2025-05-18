import type { AppError, AsyncResult, GetListOptions, ReadDatabase, View, ViewMap } from '../types'
import { err, ok } from './result'

export class ReadDatabaseInMemory implements ReadDatabase {
  private storage: Record<string, Record<string, View>> = {}

  async getList<K extends keyof ViewMap, F extends GetListOptions<ViewMap[K]>>(
    type: K,
    filter: F
  ): AsyncResult<ViewMap[K][], AppError> {
    const dataMap = this.storage[type]
    if (!dataMap) return ok([])

    let items: ViewMap[K][] = Object.values(dataMap) as ViewMap[K][]

    // filter
    for (const key in filter) {
      if (['limit', 'offset', 'sortBy', 'sortOrder'].includes(key)) {
        continue
      }

      const value = filter[key as keyof F]
      if (value !== undefined) {
        items = items.filter(item => {
          return item[key as keyof ViewMap[K]] === value
        })
      }
    }

    // sort
    if (filter.sortBy) {
      const { sortBy, sortOrder = 'asc' } = filter
      items = [...items].sort((a, b) => {
        const aVal = a[sortBy]
        const bVal = b[sortBy]

        if (aVal == null || bVal == null) return 0
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }

    // pagination
    const offset = filter.offset ?? 0
    const limit = filter.limit ?? items.length
    const paged = items.slice(offset, offset + limit)

    return ok(paged)
  }

  async getById<K extends keyof ViewMap>(type: K, id: string): AsyncResult<ViewMap[K], AppError> {
    const typeStorage = this.storage[type as string] || {}
    const view = typeStorage[id]
    if (!view) {
      return err({
        code: 'VIEW_NOT_FOUND',
        message: `View not found: ${type} with id ${id}`
      })
    }
    return ok(view)
  }

  async save<K extends keyof ViewMap>(type: K, data: ViewMap[K]): AsyncResult<void, AppError> {
    const typeStorage = this.storage[type as string] || {}
    typeStorage[(data as View).id] = data
    this.storage[type as string] = typeStorage
    return ok(undefined)
  }

  async delete<K extends keyof ViewMap>(type: K, id: string): AsyncResult<void, AppError> {
    const typeStorage = this.storage[type as string]
    if (typeStorage) {
      delete typeStorage[id]
    }
    return ok(undefined)
  }
}
