import type { AsyncResult } from '../utils/result'
import type { DomainEvent, Snapshot } from './command'
import type { AppError } from './error'
import type { AggregateId } from './id'

export interface EventStore {
  getEvents(aggregateId: AggregateId, fromVersion?: number): AsyncResult<DomainEvent[], AppError>
  getLastEventVersion(aggregateId: AggregateId): AsyncResult<number, AppError>
  saveEvents(events: DomainEvent[]): AsyncResult<DomainEvent[], AppError>
  getSnapshot(aggregateId: AggregateId): AsyncResult<Snapshot | null, AppError>
  saveSnapshot(snapshot: Snapshot): AsyncResult<void, AppError>
}
