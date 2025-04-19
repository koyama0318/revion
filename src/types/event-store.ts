import type { AsyncResult } from '../utils/result'
import type { DomainEvent, Snapshot } from './domain-event'
import type { AggregateId } from './id'

export interface EventStore {
  getEvents(aggregateId: AggregateId, fromVersion?: number): AsyncResult<DomainEvent[], Error>
  getLastEventVersion(aggregateId: AggregateId): AsyncResult<number, Error>
  saveEvents(events: DomainEvent[]): AsyncResult<DomainEvent[], Error>
  getSnapshot(aggregateId: AggregateId): AsyncResult<Snapshot | null, Error>
  saveSnapshot(snapshot: Snapshot): AsyncResult<void, Error>
}
