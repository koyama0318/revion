import type { Result } from '../utils/result'
import type { Command } from './command'
import type { DomainEvent } from './domain-event'
import type { AppError } from './error'
import type { AggregateId } from './id'

export interface State {
  readonly aggregateId: AggregateId
  readonly version: number
}

/**
 * A function that decides which event payloads to generate based on the current state and a command.
 * @template S The type of the aggregate state.
 * @template C The type of the command.
 * @template E The specific type(s) of domain event this decider can generate.
 * @param state The current state of the aggregate.
 * @param command The command to process.
 * @returns A Result containing an array of event payloads on success, or an AppError on failure.
 */
export type EventDecider<S extends State, C extends Command, E extends DomainEvent> = (
  state: S,
  command: C
) => Result<E[], AppError>

/**
 * A function that applies an event to the current state to produce the next state.
 * It should be a pure function and handle different event payload types internally.
 * @template S The type of the aggregate state.
 * @template E The specific type(s) of domain event this reducer can handle.
 * @param state The current state.
 * @param event The domain event to apply.
 * @returns The next state.
 */
export type Reducer<S extends State, E extends DomainEvent> = (state: S, event: E) => S
