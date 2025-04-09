import type { ResultAsync } from 'neverthrow'
import type { AppError } from './app-error'
import type { AggregateId, AggregateType } from './id'

/** Represents a command to be executed. */
export interface Command {
  /** The specific operation requested by the command. */
  readonly operation: string
  /** The type of the aggregate this command targets. */
  readonly aggregateType: AggregateType
  /** The unique identifier of the aggregate this command targets. */
  readonly aggregateId: AggregateId
  /** Optional data payload associated with the command. */
  readonly payload?: unknown
}

/** Represents the asynchronous result of processing a command. */
export type CommandResultAsync = ResultAsync<unknown, AppError>
