import type {
  AggregateId,
  DomainEvent,
  EventStore,
  ExtendedDomainEvent,
  Snapshot,
  State
} from '../types'

export class EventStoreInMemory implements EventStore {
  readonly events: ExtendedDomainEvent<DomainEvent>[] = []
  readonly snapshots: Snapshot<State>[] = []

  async getEvents<E extends DomainEvent>(
    aggregateId: AggregateId,
    fromVersion = 0
  ): Promise<ExtendedDomainEvent<E>[]> {
    const events = this.events.filter(
      e =>
        e.aggregateId.type === aggregateId.type &&
        e.aggregateId.id === aggregateId.id &&
        e.version >= fromVersion
    )
    return events as ExtendedDomainEvent<E>[]
  }

  async getLastEventVersion(aggregateId: AggregateId): Promise<number> {
    const events = this.events.filter(
      e => e.aggregateId.type === aggregateId.type && e.aggregateId.id === aggregateId.id
    )
    return events.length
  }

  async saveEvents<E extends DomainEvent>(events: ExtendedDomainEvent<E>[]): Promise<void> {
    this.events.push(...events)
  }

  async getSnapshot<S extends State>(aggregateId: AggregateId): Promise<Snapshot<S> | null> {
    const snapshot = this.snapshots.find(
      snapshot =>
        snapshot.state.id.type === aggregateId.type && snapshot.state.id.id === aggregateId.id
    )
    return snapshot as Snapshot<S> | null
  }

  async saveSnapshot<S extends State>(snapshot: Snapshot<S>): Promise<void> {
    this.snapshots.push(snapshot)
  }
}
