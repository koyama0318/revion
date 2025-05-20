import type { AggregateId } from './aggregate-id'
import type { DomainEvent, ExtendedDomainEvent, Snapshot, State } from './command'

export type EventStore = {
  getEvents<E extends DomainEvent>(
    aggregateId: AggregateId,
    fromVersion?: number
  ): Promise<ExtendedDomainEvent<E>[]>
  getLastEventVersion(aggregateId: AggregateId): Promise<number>
  saveEvents<E extends DomainEvent>(events: ExtendedDomainEvent<E>[]): Promise<void>
  getSnapshot<S extends State>(aggregateId: AggregateId): Promise<Snapshot<S> | null>
  saveSnapshot<S extends State>(snapshot: Snapshot<S>): Promise<void>
}
