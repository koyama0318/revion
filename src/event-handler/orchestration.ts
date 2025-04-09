import { ResultAsync } from 'neverthrow'
import type { AppError } from '../types/app-error'
import type { DomainEvent, DomainEventPayload } from '../types/event'
import type { HandleEventFn } from './handler'

/**
 * Represents an event handler registry.
 */
export interface EventHandlerRegistry {
  /**
   * Registers a handler for an event type.
   * @param eventType - The type of event to handle.
   * @param handler - The handler function.
   */
  registerHandler(eventType: string, handler: HandleEventFn): void

  /**
   * Gets all handlers for an event type.
   * @param eventType - The type of event to get handlers for.
   * @returns An array of handler functions.
   */
  getHandlers(eventType: string): HandleEventFn[]
}

/**
 * Creates an in-memory event handler registry.
 * @returns A new EventHandlerRegistry instance.
 */
export function createEventHandlerRegistry(): EventHandlerRegistry {
  const handlers = new Map<string, HandleEventFn[]>()

  return {
    registerHandler: (eventType: string, handler: HandleEventFn) => {
      const existingHandlers = handlers.get(eventType) || []
      handlers.set(eventType, [...existingHandlers, handler])
    },

    getHandlers: (eventType: string) => {
      return handlers.get(eventType) || []
    }
  }
}

/**
 * Creates an event handler orchestrator.
 * @param registry - The event handler registry.
 * @returns A new event handler that orchestrates multiple handlers.
 */
export function createEventHandlerOrchestrator(
  registry: EventHandlerRegistry
): HandleEventFn {
  return (event: DomainEvent<DomainEventPayload>) => {
    const handlers = registry.getHandlers(event.eventType)

    if (handlers.length === 0) {
      // No handlers registered for this event type
      return ResultAsync.fromPromise(
        Promise.resolve(),
        error => error as AppError
      )
    }

    // Process all handlers in sequence
    let result: ResultAsync<void, AppError> = ResultAsync.fromPromise(
      Promise.resolve(),
      error => error as AppError
    )

    for (const handler of handlers) {
      result = result.andThen(() => handler(event))
    }

    return result
  }
}
