import type {
  AggregateId,
  AppError,
  AsyncResult,
  DomainEvent,
  EventStore,
  ExtendedDomainEvent,
  Snapshot,
  State
} from '../types'
import { ok } from './result'

export class EventStoreInMemory implements EventStore {
  readonly events: ExtendedDomainEvent<DomainEvent>[] = []
  readonly snapshots: Snapshot<State>[] = []

  async getEvents<E extends DomainEvent>(
    aggregateId: AggregateId,
    fromVersion = 0
  ): AsyncResult<ExtendedDomainEvent<E>[], AppError> {
    const events = this.events.filter(
      e =>
        e.aggregateId.type === aggregateId.type &&
        e.aggregateId.id === aggregateId.id &&
        e.version >= fromVersion
    )
    return ok(events as ExtendedDomainEvent<E>[])
  }

  async getLastEventVersion(aggregateId: AggregateId): AsyncResult<number, AppError> {
    const events = this.events.filter(
      e => e.aggregateId.type === aggregateId.type && e.aggregateId.id === aggregateId.id
    )
    return ok(events.length)
  }

  async saveEvents<E extends DomainEvent>(
    events: ExtendedDomainEvent<E>[]
  ): AsyncResult<void, AppError> {
    this.events.push(...events)
    return ok(undefined)
  }

  async getSnapshot<S extends State>(
    aggregateId: AggregateId
  ): AsyncResult<Snapshot<S> | null, AppError> {
    const snapshot = this.snapshots.find(
      snapshot =>
        snapshot.state.id.type === aggregateId.type && snapshot.state.id.id === aggregateId.id
    )
    return ok(snapshot as Snapshot<S> | null)
  }

  async saveSnapshot<S extends State>(snapshot: Snapshot<S>): AsyncResult<void, AppError> {
    this.snapshots.push(snapshot)
    return ok(undefined)
  }
}
