import type { AppError, AsyncResult, DomainEvent, ExtendedDomainEvent } from '../types'
import { err } from '../utils'
import { type EventHandler, type EventHandlerDeps, createEventHandlers } from './event-handler'
import type { AnyEventReactor } from './event-reactor'

type EventBus = EventHandler

export function createEventBus(deps: EventHandlerDeps, reactors: AnyEventReactor[]): EventBus {
  const handlers = createEventHandlers(deps, reactors)

  return async (event: ExtendedDomainEvent<DomainEvent>): AsyncResult<void, AppError> => {
    const handler = handlers[event.aggregateId.type]
    if (!handler) {
      return err({
        code: 'EVENT_HANDLER_NOT_FOUND',
        message: `Handler for event type ${event.event.type} not found`
      })
    }

    return handler(event)
  }
}
