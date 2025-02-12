import type { Query, ReadModel } from './query'

export interface ReadModelStore {
  fetchAll<T extends ReadModel>(query: Query<T>): Promise<T[]>
  fetchById<T extends ReadModel>(query: Query<T>): Promise<T | undefined>
  upsert<T extends ReadModel>(item: T): Promise<void>
}
