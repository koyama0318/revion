import type { AsyncResult } from '../utils/result'
import type { Command } from './command'
import type { AppError } from './error'
import type { EventStore } from './event-store'

export type CommandHandlerFactory = (eventStore: EventStore) => CommandHandler

export type CommandHandler = (command: Command) => AsyncResult<void, AppError>

export type CommandMiddleware = (command: Command, next: CommandHandler) => AsyncResult<void, AppError>

export interface CommandBus {
  dispatch: CommandHandler
}
