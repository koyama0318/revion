import type { DomainEvent, Snapshot } from '../types/command'
import type { AppError } from '../types/error'
import type { EventStore } from '../types/event-store'
import type { AggregateId } from '../types/id'
import type { AsyncResult } from './result'
import { ok } from './result'

export class EventStoreInMemory implements EventStore {
  readonly events: DomainEvent[] = []
  readonly snapshots: Snapshot[] = []

  async getEvents(aggregateId: AggregateId, fromVersion = 0): AsyncResult<DomainEvent[], AppError> {
    const events = this.events.filter(e => e.aggregateId === aggregateId && e.version >= fromVersion)
    return ok(events)
  }

  async getLastEventVersion(aggregateId: AggregateId): AsyncResult<number, AppError> {
    const events = this.events.filter(e => e.aggregateId === aggregateId)
    return ok(events.length)
  }

  async saveEvents(events: DomainEvent[]): AsyncResult<DomainEvent[], AppError> {
    this.events.push(...events)
    return ok(events)
  }

  async getSnapshot(aggregateId: AggregateId): AsyncResult<Snapshot | null, AppError> {
    const snapshot = this.snapshots.find(snapshot => snapshot.aggregateId === aggregateId)
    return ok(snapshot ?? null)
  }

  async saveSnapshot(snapshot: Snapshot): AsyncResult<void, AppError> {
    this.snapshots.push(snapshot)
    return ok(undefined)
  }
}
