import type { Result } from 'neverthrow'
import type { AppError } from './app-error'
import type { DomainEvent, DomainEventPayload } from './event'
import type { ReadModel } from './read-model'

/**
 * Represents an update to a read model.
 */
export type ReadModelUpdate<T extends ReadModel> =
  | {
      type: 'upsert'
      readModel: T
    }
  | {
      type: 'patch'
      id: string
      updates: Partial<T>
    }
  | {
      type: 'delete'
      id: string
    }

/**
 * A function that projects a domain event to read model updates.
 * @template T The type of the read model.
 * @param event - The domain event to project.
 * @returns A Result containing an array of read model updates on success, or an AppError on failure.
 */
export type GenericProjector<T extends ReadModel> = (
  event: DomainEvent<DomainEventPayload>
) => Result<ReadModelUpdate<T>[], AppError>
