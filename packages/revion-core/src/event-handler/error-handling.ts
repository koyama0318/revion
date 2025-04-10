import { ResultAsync } from 'neverthrow'
import type { AppError } from '../types/app-error'
import type { DomainEvent, DomainEventPayload } from '../types/domain-event'
import type { HandleEventFn } from './event-handler'

/**
 * Represents a dead letter queue entry.
 */
export interface DeadLetterQueueEntry {
  /**
   * The event that failed to process.
   */
  event: DomainEvent<DomainEventPayload>

  /**
   * The error that occurred during processing.
   */
  error: AppError

  /**
   * The number of times this event has been retried.
   */
  retryCount: number

  /**
   * The timestamp when this entry was created.
   */
  createdAt: Date

  /**
   * The timestamp when this entry was last retried.
   */
  lastRetriedAt: Date | null
}

/**
 * Options for retrying failed events.
 */
export interface RetryOptions {
  /**
   * The maximum number of retries before giving up.
   * @default 3
   */
  maxRetries?: number

  /**
   * The delay between retries in milliseconds.
   * @default 1000
   */
  retryDelay?: number

  /**
   * Whether to use exponential backoff for retries.
   * @default true
   */
  exponentialBackoff?: boolean
}

/**
 * Creates a dead letter queue handler.
 * @param options - The retry options.
 * @returns A function that handles failed events.
 */
export function createDeadLetterQueueHandler(
  options: RetryOptions = {}
): (entry: DeadLetterQueueEntry) => ResultAsync<void, AppError> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true
  } = options

  return (entry: DeadLetterQueueEntry) => {
    if (entry.retryCount >= maxRetries) {
      // Log the failure and give up
      console.error(
        `[DeadLetterQueue] Event ${entry.event.eventId} failed after ${maxRetries} retries:`,
        entry.error
      )
      return ResultAsync.fromPromise(
        Promise.resolve(),
        error => error as AppError
      )
    }

    // Calculate the delay for the next retry
    const delay = exponentialBackoff
      ? retryDelay * 2 ** entry.retryCount
      : retryDelay

    // Schedule the retry
    return ResultAsync.fromPromise(
      new Promise<void>(resolve => {
        setTimeout(() => {
          resolve()
        }, delay)
      }),
      error => error as AppError
    )
  }
}

/**
 * Creates an error handling wrapper for an event handler.
 * @param handler - The event handler to wrap.
 * @param deadLetterQueueHandler - The dead letter queue handler.
 * @returns A new event handler with error handling.
 */
export function withErrorHandling(
  handler: HandleEventFn,
  deadLetterQueueHandler: (
    entry: DeadLetterQueueEntry
  ) => ResultAsync<void, AppError>
): HandleEventFn {
  return (event: DomainEvent<DomainEventPayload>) => {
    return handler(event).mapErr(error => {
      // Create a dead letter queue entry
      const entry: DeadLetterQueueEntry = {
        event,
        error,
        retryCount: 0,
        createdAt: new Date(),
        lastRetriedAt: null
      }

      // Handle the error using the dead letter queue handler
      deadLetterQueueHandler(entry).mapErr(dlqError => {
        console.error(
          `[ErrorHandling] Failed to handle error for event ${event.eventId}:`,
          dlqError
        )
      })

      return error
    })
  }
}
