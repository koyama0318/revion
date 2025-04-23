import type { DomainEvent } from '../types/command'
import type { AppError } from '../types/error'
import type { EventHandler } from '../types/event'
import { parseAggregateId } from '../types/id'
import { type AsyncResult, err } from '../utils/result'

export class EventBus {
  constructor(private handlers: Record<string, EventHandler>) {}

  async receive(event: DomainEvent): AsyncResult<void, AppError> {
    const id = parseAggregateId(event.aggregateId)
    if (!id.ok) {
      return err(id.error)
    }

    const handler = this.handlers[id.value.type]
    if (!handler) {
      return err({
        code: 'HANDLER_NOT_FOUND',
        message: `Event handler for aggregate ${id.value.type} not found`
      })
    }

    return handler(event)
  }
}
