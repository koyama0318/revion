import type { AppError, AsyncResult, Command } from '../types'
import { err, validateAggregateId } from '../utils'
import type { AnyAggregate } from './aggregate'
import {
  type CommandHandler,
  type CommandHandlerDeps,
  createCommandHandlers
} from './command-handler'
import type { AnyDomainService } from './domain-service'

type CommandBus = CommandHandler

export type CommandHandlerMiddleware = (
  command: Command,
  next: CommandHandler
) => AsyncResult<void, AppError>

export function createCommandBus(
  deps: CommandHandlerDeps,
  aggregates: AnyAggregate[],
  services: AnyDomainService[],
  middleware: CommandHandlerMiddleware[] = []
): CommandBus {
  const handlers = createCommandHandlers(deps, aggregates, services)

  const applyMiddleware = (handler: CommandHandler): CommandHandler => {
    return middleware.reduceRight<CommandHandler>((next, m) => {
      return (command: Command) => m(command, next)
    }, handler)
  }

  return async (command: Command): AsyncResult<void, AppError> => {
    if (command.operation === '') {
      return err({
        code: 'INVALID_OPERATION',
        message: 'Operation is required'
      })
    }

    const validated = validateAggregateId(command.id)
    if (!validated.ok) return validated

    const handler = handlers[command.id.type]
    if (!handler) {
      return err({
        code: 'COMMAND_HANDLER_NOT_FOUND',
        message: `Handler for operation ${command.operation} not found`
      })
    }

    return applyMiddleware(handler)(command)
  }
}
