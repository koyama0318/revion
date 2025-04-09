import type { State } from './command-aggregate'
import type { DomainEvent, DomainEventPayload } from './event'
import type { AggregateId, AggregateType } from './id'
import type { Snapshot } from './snapshot'

/** Interface for storing and retrieving domain events and snapshots. */
export interface EventStore {
  /**
   * Loads the event history for a specific aggregate.
   * @param aggregateType The type of the aggregate.
   * @param fromVersion Optional version number to load events from (exclusive).
   * @returns A promise that resolves with an array of domain events.
   */
  loadHistory(
    aggregateType: string,
    fromVersion?: number
  ): Promise<DomainEvent<DomainEventPayload>[]>

  /**
   * Saves a list of domain events.
   * @param events An array of domain events to save.
   * @returns A promise that resolves when saving is complete.
   */
  save(events: DomainEvent<DomainEventPayload>[]): Promise<void>

  /**
   * Loads the latest snapshot for a specific aggregate.
   * @template S The type of the aggregate state.
   * @param aggregateType The type of the aggregate.
   * @returns A promise that resolves with the latest snapshot, or undefined if none exists.
   */
  loadSnapshot<S extends State>(
    aggregateType: string
  ): Promise<Snapshot<S> | undefined>

  /**
   * Saves a snapshot of an aggregate's state.
   * @template S The type of the aggregate state.
   * @param snapshot The snapshot data to save.
   * @returns A promise that resolves when saving is complete.
   */
  saveSnapshot<S extends State>(snapshot: Snapshot<S>): Promise<void>
}
