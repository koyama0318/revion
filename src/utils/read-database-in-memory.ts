import type { GetListOptions, ReadDatabase, View, ViewMap } from '../types'

export class ReadDatabaseInMemory implements ReadDatabase {
  storage: Record<string, Record<string, View>> = {}

  async getList<K extends keyof ViewMap, F extends GetListOptions<ViewMap[K]>>(
    type: K,
    options: F
  ): Promise<ViewMap[K][]> {
    const dataMap = this.storage[type]
    if (!dataMap) return []

    let items: ViewMap[K][] = Object.values(dataMap) as ViewMap[K][]

    // filter
    for (const key in options) {
      if (['limit', 'offset', 'sortBy', 'sortOrder'].includes(key)) {
        continue
      }

      const value = options[key as keyof F]
      if (value !== undefined) {
        items = items.filter(item => {
          return item[key as keyof ViewMap[K]] === value
        })
      }
    }

    // sort
    if (options.sortBy) {
      const { sortBy, sortOrder = 'asc' } = options
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
    const offset = options.offset ?? 0
    const limit = options.limit ?? items.length
    const paged = items.slice(offset, offset + limit)

    return paged
  }

  async getById<K extends keyof ViewMap>(type: K, id: string): Promise<ViewMap[K] | null> {
    const typeStorage = this.storage[type as string] || {}
    const view = typeStorage[id]
    if (!view) return null
    return view
  }

  async save<K extends keyof ViewMap>(type: K, data: ViewMap[K]): Promise<void> {
    const typeStorage = this.storage[type as string] || {}
    typeStorage[(data as View).id] = data
    this.storage[type as string] = typeStorage
  }

  async delete<K extends keyof ViewMap>(type: K, id: string): Promise<void> {
    const typeStorage = this.storage[type as string]
    if (typeStorage) {
      delete typeStorage[id]
    }
  }
}
