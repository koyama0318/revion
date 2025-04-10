import type { Result } from 'neverthrow'
import type { AggregateId, AggregateType } from './aggregate-id'
import type { AppError } from './app-error'
import type { Command } from './command'
import type { DomainEvent, DomainEventPayload } from './domain-event'
import type { Snapshot } from './snapshot'

/** Represents the state of an aggregate. */
export interface State {
  readonly aggregateType: AggregateType
  readonly aggregateId: AggregateId
}

/**
 * A function that decides which event payloads to generate based on the current state and a command.
 * @template S The type of the aggregate state.
 * @template C The type of the command.
 * @template P The specific type(s) of domain event payload this decider can generate.
 * @param state The current state of the aggregate.
 * @param command The command to process.
 * @returns A Result containing an array of event payloads on success, or an AppError on failure.
 */
export type EventDecider<
  S extends State,
  C extends Command,
  P extends DomainEventPayload
> = (state: S, command: C) => Result<P[], AppError>

/**
 * A function that applies an event to the current state to produce the next state.
 * It should be a pure function and handle different event payload types internally.
 * @template S The type of the aggregate state.
 * @template P The specific type(s) of domain event payload this reducer can handle.
 * @param state The current state.
 * @param event The domain event to apply.
 * @returns The next state.
 */
export type Reducer<S extends State, P extends DomainEventPayload> = (
  state: S,
  event: DomainEvent<P>
) => S

/** Defines the interface for a command aggregate root. */
export interface ICommandAggregate {
  /** Gets the type of the aggregate. */
  getAggregateType(): AggregateType
  /** Gets the unique identifier of the aggregate. */
  getAggregateId(): AggregateId
  /** Gets the current state of the aggregate. */
  getState(): State
  /** Gets the current version of the aggregate (number of events applied). */
  getVersion(): number
  /** Loads the aggregate state from its event history. */
  loadFromHistory(events: DomainEvent<DomainEventPayload>[]): void
  /** Restores the aggregate's version, typically after loading from a snapshot. */
  restoreVersion(version: number): void
  /**
   * Dispatches a command to the aggregate, potentially generating new domain events.
   * @param command The command to dispatch.
   * @returns A Result containing an array of newly generated domain events on success, or an AppError on failure.
   */
  dispatch(
    command: Command
  ): Result<DomainEvent<DomainEventPayload>[], AppError>
}
