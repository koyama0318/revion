import type { DomainEvent, Snapshot } from '../types/command'
import type { EventStore } from '../types/event-store'
import type { AggregateId } from '../types/id'

export class EventStoreInMemory implements EventStore {
  readonly events: DomainEvent[] = []
  readonly snapshots: Snapshot[] = []

  async getEvents(aggregateId: AggregateId, fromVersion = 0): Promise<DomainEvent[]> {
    const events = this.events.filter(e => e.aggregateId === aggregateId && e.version >= fromVersion)
    return events
  }

  async getLastEventVersion(aggregateId: AggregateId): Promise<number> {
    const events = this.events.filter(e => e.aggregateId === aggregateId)
    return events.length
  }

  async saveEvents(events: DomainEvent[]): Promise<DomainEvent[]> {
    this.events.push(...events)
    return events
  }

  async getSnapshot(aggregateId: AggregateId): Promise<Snapshot | null> {
    const snapshot = this.snapshots.find(snapshot => snapshot.aggregateId === aggregateId)
    return snapshot ?? null
  }

  async saveSnapshot(snapshot: Snapshot): Promise<void> {
    this.snapshots.push(snapshot)
  }
}
