import type { AggregateId } from './aggregate-id'
import type { AppError } from './app-error'
import type { DomainEvent, ExtendedDomainEvent, Snapshot, State } from './command'
import type { AsyncResult } from './result'

export type EventStore = {
  getEvents<E extends DomainEvent>(
    aggregateId: AggregateId,
    fromVersion?: number
  ): AsyncResult<ExtendedDomainEvent<E>[], AppError>
  getLastEventVersion(aggregateId: AggregateId): AsyncResult<number, AppError>
  saveEvents<E extends DomainEvent>(events: ExtendedDomainEvent<E>[]): AsyncResult<void, AppError>
  getSnapshot<S extends State>(aggregateId: AggregateId): AsyncResult<Snapshot<S> | null, AppError>
  saveSnapshot<S extends State>(snapshot: Snapshot<S>): AsyncResult<void, AppError>
}
