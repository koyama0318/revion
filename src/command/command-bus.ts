import type { Command, CommandHandler, CommandMiddleware } from '../types/command'
import type { AppError } from '../types/error'
import { parseAggregateId } from '../types/id'
import { type AsyncResult, err } from '../utils/result'

export class CommandBus {
  constructor(
    private handlers: Record<string, CommandHandler>,
    private middleware: CommandMiddleware[]
  ) {}

  async dispatch(command: Command): AsyncResult<void, AppError> {
    if (command.operation === '') {
      return err({
        code: 'INVALID_OPERATION',
        message: 'Operation is required'
      })
    }

    const id = parseAggregateId(command.aggregateId)
    if (!id.ok) {
      return err(id.error)
    }

    const handler = this.handlers[id.value.type]
    if (!handler) {
      return err({
        code: 'HANDLER_NOT_FOUND',
        message: `Handler for aggregate ${id.value.type} not found`
      })
    }

    return this.applyMiddleware(handler)(command)
  }

  applyMiddleware(handler: CommandHandler): CommandHandler {
    return this.middleware.reduceRight<CommandHandler>((next, middleware) => {
      return (command: Command) => middleware(command, next)
    }, handler)
  }
}
