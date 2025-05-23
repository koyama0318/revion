import type {
  AppError,
  AsyncResult,
  CommandDispatcher,
  DomainEvent,
  ExtendedDomainEvent,
  ReadDatabase
} from '../types'
import { ok } from '../utils'
import type { AnyEventReactor } from './event-reactor'
import { createDispatchEventFnFactory } from './fn/dispatch-event'
import { createProjectEventFnFactory } from './fn/project-event'

export type EventHandlerDeps = {
  eventDispatcher: CommandDispatcher
  readDatabase: ReadDatabase
}

export type EventHandler = (event: ExtendedDomainEvent<DomainEvent>) => AsyncResult<void, AppError>

type EventHandlerFactory<D extends EventHandlerDeps = EventHandlerDeps> = (deps: D) => EventHandler

function createEventHandlerFactory<D extends EventHandlerDeps>(
  reactor: AnyEventReactor
): EventHandlerFactory<D> {
  return (deps: D) => {
    const dispatch = createDispatchEventFnFactory(reactor.policy)(deps.eventDispatcher)
    const projection = createProjectEventFnFactory(reactor.projection)(deps.readDatabase)

    return async (event: ExtendedDomainEvent<DomainEvent>) => {
      const [dispatched, projected] = await Promise.all([dispatch(event), projection(event)])
      if (!dispatched.ok) return dispatched
      if (!projected.ok) return projected

      return ok(undefined)
    }
  }
}

export function createEventHandlers(
  deps: EventHandlerDeps,
  eventReactors: AnyEventReactor[]
): Record<string, EventHandler> {
  const handlers: Record<string, EventHandler> = {}

  for (const reactor of eventReactors) {
    handlers[reactor.type] = createEventHandlerFactory(reactor)(deps)
  }

  return handlers
}
