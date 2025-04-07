import type { AggregateId, Event } from './aggregate'

export interface EventStore {
  load(id: AggregateId): Promise<Event[]>
  save(events: Event[]): Promise<void>
}

export interface ReadModelStore {
  fetchAll<T extends ReadModel>(query: Query): Promise<T[]>
  fetchById<T extends ReadModel>(query: Query): Promise<T | undefined>
  upsert<T extends ReadModel>(item: T): Promise<void>
}
