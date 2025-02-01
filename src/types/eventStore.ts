import type { AggregateId, Event } from './aggregate'

export interface EventStore {
  load(id: AggregateId): Promise<Event[]>
  save(events: Event[]): Promise<void>
}
