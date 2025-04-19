import type { Result } from '../utils/result'
import type { AppError } from './error'
import type { AggregateId } from './id'

export interface Command {
  readonly aggregateId: AggregateId
  readonly operation: string
  readonly payload?: unknown
}

export type CommandResult = Result<void, AppError>
