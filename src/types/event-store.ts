import type { DomainEvent, Snapshot } from './command'
import type { AggregateId } from './id'

export interface EventStore {
  getEvents(aggregateId: AggregateId, fromVersion?: number): Promise<DomainEvent[]>
  getLastEventVersion(aggregateId: AggregateId): Promise<number>
  saveEvents(events: DomainEvent[]): Promise<DomainEvent[]>
  getSnapshot(aggregateId: AggregateId): Promise<Snapshot | null>
  saveSnapshot(snapshot: Snapshot): Promise<void>
}
