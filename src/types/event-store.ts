import type { Result } from 'neverthrow'
import type { AggregateId, AggregateType } from './aggregate-id'
import type { AppError } from './app-error'
import type { State } from './command-aggregate'
import type { DomainEvent, DomainEventPayload } from './domain-event'
import type { Snapshot } from './snapshot'

/** Interface for storing and retrieving domain events and snapshots. */
export interface EventStore<S extends State, P extends DomainEventPayload> {
  /**
   * Loads the event history for a specific aggregate.
   * @param aggregateType The type of the aggregate.
   * @param aggregateId The ID of the aggregate.
   * @param fromVersion Optional version number to load events from (exclusive).
   * @returns A promise that resolves with a result containing an array of domain events or an error.
   */
  loadHistory(
    aggregateType: AggregateType,
    aggregateId: AggregateId,
    fromVersion?: number
  ): Promise<Result<DomainEvent<P>[], AppError>>

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
    events: DomainEvent<P>[]
  ): Promise<Result<void, AppError>>

  /**
   * Loads the latest snapshot for a specific aggregate.
   * @param aggregateType The type of the aggregate.
   * @param aggregateId The ID of the aggregate.
   * @returns A promise that resolves with a result containing the latest snapshot or an error.
   */
  loadSnapshot(
    aggregateType: AggregateType,
    aggregateId: AggregateId
  ): Promise<Result<Snapshot<S> | undefined, AppError>>

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
    snapshot: Snapshot<S>
  ): Promise<Result<void, AppError>>
}
