import type { Snapshot } from '../types/domain-event'
import type { DomainEvent } from '../types/domain-event'
import type { EventStore } from '../types/event-store'
import type { AggregateId } from '../types/id'
import type { AsyncResult } from './result'
import { ok } from './result'

export class EventStoreInMemory implements EventStore {
  readonly events: DomainEvent[] = []
  readonly snapshots: Snapshot[] = []

  async getEvents(aggregateId: AggregateId, fromVersion: number): AsyncResult<DomainEvent[], Error> {
    const events = this.events.filter(e => e.aggregateId === aggregateId && e.version >= fromVersion)
    return ok(events)
  }

  async getLastEventVersion(aggregateId: AggregateId): AsyncResult<number, Error> {
    const events = this.events.filter(e => e.aggregateId === aggregateId)
    return ok(events.length)
  }

  async saveEvents(events: DomainEvent[]): AsyncResult<DomainEvent[], Error> {
    this.events.push(...events)
    return ok(events)
  }

  async getSnapshot(aggregateId: AggregateId): AsyncResult<Snapshot | null, Error> {
    const snapshot = this.snapshots.find(snapshot => snapshot.aggregateId === aggregateId)
    return ok(snapshot ?? null)
  }

  async saveSnapshot(snapshot: Snapshot): AsyncResult<void, Error> {
    this.snapshots.push(snapshot)
    return ok(undefined)
  }
}
