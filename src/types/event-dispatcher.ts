import type { AppError } from './app-error'
import type { Command } from './command'
import type { AsyncResult } from './result'

export type CommandDispatcher = {
  dispatch(command: Command): AsyncResult<void, AppError>
}
