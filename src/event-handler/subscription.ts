import { ResultAsync } from 'neverthrow'
import type { AppError } from '../types/app-error'
import type { DomainEvent, DomainEventPayload } from '../types/domain-event'
import type { HandleEventFn } from './event-handler'

/**
 * Represents a subscription to events from the EventStore.
 */
export interface EventSubscription {
  /**
   * Starts the subscription and begins processing events.
   * @returns A ResultAsync containing void on success, or an AppError on failure.
   */
  start(): ResultAsync<void, AppError>

  /**
   * Stops the subscription and stops processing events.
   * @returns A ResultAsync containing void on success, or an AppError on failure.
   */
  stop(): ResultAsync<void, AppError>
}

/**
 * Options for creating an event subscription.
 */
export interface EventSubscriptionOptions {
  /**
   * The interval in milliseconds at which to poll for new events.
   * @default 1000
   */
  pollInterval?: number

  /**
   * The maximum number of events to process in a single batch.
   * @default 100
   */
  batchSize?: number

  /**
   * The name of the subscription. Used for logging and identification.
   */
  name: string
}

/**
 * Creates a new event subscription.
 * @param eventStore - The event store to subscribe to.
 * @param handler - The handler function to process events.
 * @param options - The options for the subscription.
 * @returns A new EventSubscription instance.
 */
export function createEventSubscription(
  eventStore: {
    loadEvents: (
      fromVersion: number,
      limit: number
    ) => Promise<DomainEvent<DomainEventPayload>[]>
  },
  handler: HandleEventFn,
  options: EventSubscriptionOptions
): EventSubscription {
  const { pollInterval = 1000, batchSize = 100, name } = options

  let isRunning = false
  let lastProcessedVersion = 0
  let pollTimeout: number | null = null

  const poll = async (): Promise<void> => {
    if (!isRunning) return

    try {
      const events = await eventStore.loadEvents(
        lastProcessedVersion + 1,
        batchSize
      )
      if (events.length === 0) {
        // No new events, schedule next poll
        pollTimeout = setTimeout(poll, pollInterval) as unknown as number
        return
      }

      // Process events in sequence
      for (const event of events) {
        const result = await handler(event)
        if (result.isErr()) {
          console.error(`[${name}] Failed to process event:`, result.error)
          // Continue processing other events even if one fails
          continue
        }
        lastProcessedVersion = event.version
      }

      // Schedule next poll
      pollTimeout = setTimeout(poll, pollInterval) as unknown as number
    } catch (error) {
      console.error(`[${name}] Polling failed:`, error)
      // Schedule next poll even if there was an error
      pollTimeout = setTimeout(poll, pollInterval) as unknown as number
    }
  }

  return {
    start: () => {
      if (isRunning) {
        return ResultAsync.fromPromise(
          Promise.reject(new Error('Subscription is already running')),
          error => error as AppError
        )
      }

      isRunning = true
      pollTimeout = setTimeout(poll, 0) as unknown as number

      return ResultAsync.fromPromise(
        Promise.resolve(),
        error => error as AppError
      )
    },

    stop: () => {
      if (!isRunning) {
        return ResultAsync.fromPromise(
          Promise.reject(new Error('Subscription is not running')),
          error => error as AppError
        )
      }

      isRunning = false
      if (pollTimeout) {
        clearTimeout(pollTimeout)
        pollTimeout = null
      }

      return ResultAsync.fromPromise(
        Promise.resolve(),
        error => error as AppError
      )
    }
  }
}
