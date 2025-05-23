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
  ): Promise<ViewMap[K][]>
  getById<K extends keyof ViewMap>(type: K, id: string): Promise<ViewMap[K]>
  save<K extends keyof ViewMap>(type: K, data: ViewMap[K]): Promise<void>
  delete<K extends keyof ViewMap>(type: K, id: string): Promise<void>
}
