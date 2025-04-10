import { ResultAsync } from 'neverthrow'
import type { AppError } from '../types/app-error'
import type { DomainEvent, DomainEventPayload } from '../types/domain-event'
import type { HandleEventFn } from './event-handler'

/**
 * Represents a processed event tracker.
 */
export interface ProcessedEventTracker {
  /**
   * Checks if an event has been processed.
   * @param eventId - The ID of the event to check.
   * @returns A ResultAsync containing true if the event has been processed, false otherwise.
   */
  isProcessed(eventId: string): ResultAsync<boolean, AppError>

  /**
   * Marks an event as processed.
   * @param eventId - The ID of the event to mark as processed.
   * @returns A ResultAsync containing void on success, or an AppError on failure.
   */
  markAsProcessed(eventId: string): ResultAsync<void, AppError>
}

/**
 * Creates an in-memory processed event tracker.
 * @returns A new ProcessedEventTracker instance.
 */
export function createInMemoryProcessedEventTracker(): ProcessedEventTracker {
  const processedEvents = new Set<string>()

  return {
    isProcessed: (eventId: string) => {
      return ResultAsync.fromPromise(
        Promise.resolve(processedEvents.has(eventId)),
        error => error as AppError
      )
    },

    markAsProcessed: (eventId: string) => {
      processedEvents.add(eventId)
      return ResultAsync.fromPromise(
        Promise.resolve(),
        error => error as AppError
      )
    }
  }
}

/**
 * Creates an idempotent event handler.
 * @param handler - The event handler to make idempotent.
 * @param tracker - The processed event tracker.
 * @returns A new event handler that is idempotent.
 */
export function withIdempotency(
  handler: HandleEventFn,
  tracker: ProcessedEventTracker
): HandleEventFn {
  return (event: DomainEvent<DomainEventPayload>) => {
    return tracker.isProcessed(event.eventId).andThen(isProcessed => {
      if (isProcessed) {
        // Event has already been processed, skip it
        return ResultAsync.fromPromise(
          Promise.resolve(),
          error => error as AppError
        )
      }

      // Process the event
      return handler(event).andThen(() => {
        // Mark the event as processed
        return tracker.markAsProcessed(event.eventId)
      })
    })
  }
}
