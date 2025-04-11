import { type Result, ok } from 'neverthrow'
import type {
  AggregateId,
  AggregateType,
  AppError,
  DomainEvent,
  DomainEventPayload,
  EventStore,
  Snapshot,
  State
} from 'revion-core'

export class InMemoryEventStore
  implements EventStore<State, DomainEventPayload>
{
  private events: Map<string, EventStore<State, DomainEventPayload>[]> =
    new Map()
  private snapshots: Map<string, { state: unknown; version: number }> =
    new Map()

  loadHistory(
    aggregateType: AggregateType,
    aggregateId: AggregateId,
    fromVersion?: number
  ): Promise<Result<DomainEvent<DomainEventPayload>[], AppError>> {
    for (const event of this.events.get(aggregateType) ?? []) {
      if (event.version >= fromVersion) {
        return ok(event)
      }
    }
    return ok([])
  }
  /**
   * Saves a list of domain events.
   * @param aggregateType The type of the aggregate.
   * @param aggregateId The ID of the aggregate.
   * @param events An array of domain events to save.
   * @returns A promise that resolves with a result indicating success or failure.
   */
  save(
    aggregateType: AggregateType,
    aggregateId: AggregateId,
    events: DomainEvent<DomainEventPayload>[]
  ): Promise<Result<void, AppError>> {
    return ok(undefined)
  }
  /**
   * Loads the latest snapshot for a specific aggregate.
   * @param aggregateType The type of the aggregate.
   * @param aggregateId The ID of the aggregate.
   * @returns A promise that resolves with a result containing the latest snapshot or an error.
   */
  loadSnapshot(
    aggregateType: AggregateType,
    aggregateId: AggregateId
  ): Promise<Result<Snapshot<State> | undefined, AppError>> {
    return ok(undefined)
  }
  /**
   * Saves a snapshot of an aggregate's state.
   * @param aggregateType The type of the aggregate.
   * @param aggregateId The ID of the aggregate.
   * @param snapshot The snapshot data to save.
   * @returns A promise that resolves with a result indicating success or failure.
   */
  saveSnapshot(
    aggregateType: AggregateType,
    aggregateId: AggregateId,
    snapshot: Snapshot<State>
  ): Promise<Result<void, AppError>> {
    return ok(undefined)
  }
}
