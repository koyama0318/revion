import type { AggregateId, Event } from './aggregate'

export interface EventStore {
  load(id: AggregateId): Event[]
  save(events: Event[]): void
}
