import { ResultAsync } from 'neverthrow'
import type { AppError } from '../types/app-error'
import type { DomainEvent, DomainEventPayload } from '../types/event'
import type { HandleEventFn } from './handler'

/**
 * Options for replaying events.
 */
export interface ReplayOptions {
  /**
   * The starting version to replay from.
   * @default 0
   */
  fromVersion?: number

  /**
   * The ending version to replay to.
   * @default Infinity
   */
  toVersion?: number

  /**
   * The maximum number of events to process in a single batch.
   * @default 100
   */
  batchSize?: number

  /**
   * Whether to process events in parallel.
   * @default false
   */
  parallel?: boolean
}

/**
 * Creates a function to replay events.
 * @param eventStore - The event store to replay events from.
 * @param handler - The handler function to process events.
 * @param options - The replay options.
 * @returns A function that replays events.
 */
export function createEventReplayer(
  eventStore: {
    loadEvents: (
      fromVersion: number,
      toVersion: number,
      limit: number
    ) => Promise<DomainEvent<DomainEventPayload>[]>
  },
  handler: HandleEventFn,
  options: ReplayOptions = {}
): () => ResultAsync<void, AppError> {
  const {
    fromVersion = 0,
    toVersion = Number.POSITIVE_INFINITY,
    batchSize = 100,
    parallel = false
  } = options

  return () => {
    let currentVersion = fromVersion

    const processBatch = async (): Promise<void> => {
      if (currentVersion >= toVersion) {
        return
      }

      const events = await eventStore.loadEvents(
        currentVersion,
        toVersion,
        batchSize
      )

      if (events.length === 0) {
        return
      }

      if (parallel) {
        // Process events in parallel
        await Promise.all(
          events.map(event =>
            handler(event).match(
              () => Promise.resolve(),
              error => Promise.reject(error)
            )
          )
        )
      } else {
        // Process events in sequence
        for (const event of events) {
          await handler(event).match(
            () => Promise.resolve(),
            error => Promise.reject(error)
          )
        }
      }

      currentVersion = events[events.length - 1].version + 1
      await processBatch()
    }

    return ResultAsync.fromPromise(processBatch(), error => error as AppError)
  }
}
