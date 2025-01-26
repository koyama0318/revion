import type { AggregateId, Event } from './aggregate'

export interface EventStore {
  load(id: AggregateId): Event[]
  all(): Event[]
  save(events: Event[]): void
}
