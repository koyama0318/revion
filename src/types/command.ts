import type { ResultAsync } from 'neverthrow'
import type { AppError } from './app-error'
import type { State } from './command-aggregate'
import type { DomainEvent, DomainEventPayload } from './domain-event'

/** Represents a command to be executed. */
export interface Command {
  /** The unique identifier of the command. */
  readonly commandId: string
  /** The specific operation requested by the command. */
  readonly operation: string
  /** The type of the aggregate this command targets. */
  readonly aggregateType: string
  /** The unique identifier of the aggregate this command targets. */
  readonly aggregateId: string
  /** Optional data payload associated with the command. */
  readonly payload?: unknown
}

/** Represents the asynchronous result of processing a command. */
export type CommandResultAsync = ResultAsync<
  { newState: State; events: DomainEvent<DomainEventPayload>[] },
  AppError
>
