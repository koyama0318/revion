import { type ResultAsync, errAsync, okAsync } from 'neverthrow'
import type { AppError } from '../types/app-error'
import type { DomainEvent, DomainEventPayload } from '../types/domain-event'
import type { GenericProjector } from '../types/projection'
import type { ReadModel, ReadModelRepository } from '../types/read-model'

// export interface EventHandler {
//   handle(event: DomainEvent<DomainEventPayload>): Promise<void>
// }

export type HandleEventFn = (
  event: DomainEvent<DomainEventPayload>
) => ResultAsync<void, AppError>

/**
 * Creates an event handling function that uses a projector and a repository
 * to update a specific read model based on incoming events.
 *
 * @template RM - The type of the Read Model.
 * @param projector - The projector function to generate read model updates from events.
 * @param repository - The repository to persist read model changes.
 * @returns An event handling function (HandleEventFn).
 */
export function createEventHandler<RM extends ReadModel>(
  projector: GenericProjector<RM>,
  repository: ReadModelRepository<RM>
): HandleEventFn {
  return (
    event: DomainEvent<DomainEventPayload>
  ): ResultAsync<void, AppError> => {
    // 1. Project the event to read model updates
    const projectionResult = projector(event)

    if (projectionResult.isErr()) {
      // Projection failed, log or handle error
      console.error('[EventHandler] Projection failed:', projectionResult.error)
      // Decide if this error should stop processing or just be logged
      return errAsync(projectionResult.error) // Propagate error for now
    }

    const updates = projectionResult.value

    // If no updates, do nothing
    if (updates.length === 0) {
      return okAsync(undefined)
    }

    // 2. Apply updates using the repository
    // Process updates sequentially for simplicity, could be parallelized with care
    let result: ResultAsync<void, AppError> = okAsync(undefined)
    for (const update of updates) {
      result = result.andThen(() => {
        switch (update.type) {
          case 'upsert':
            return repository.save(update.readModel)
          case 'patch':
            return repository.patch(update.id, update.updates)
          case 'delete':
            return repository.delete(update.id)
          default:
            // Should not happen with proper typing
            return okAsync(undefined)
        }
      })
    }

    return result.mapErr(repoError => {
      console.error('[EventHandler] Repository operation failed:', repoError)
      // Potentially wrap the error or add context
      return repoError
    })
  }
}
