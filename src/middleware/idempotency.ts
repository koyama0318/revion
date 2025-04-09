import { ResultAsync } from 'neverthrow'
import type { DispatchFn } from '../command/bus'
import type { AppError } from '../types/app-error'
import { createConflictError } from '../types/app-error'
import type { Command, CommandResultAsync } from '../types/command'
import { logger } from '../utils/logger'

export interface IdempotencyStore {
  /**
   * Checks if a command has been processed before.
   * @param commandId - The unique identifier of the command.
   * @returns A ResultAsync containing true if the command has been processed, false otherwise.
   */
  isProcessed(commandId: string): ResultAsync<boolean, AppError>

  /**
   * Marks a command as processed.
   * @param commandId - The unique identifier of the command.
   * @returns A ResultAsync containing void on success, or an AppError on failure.
   */
  markAsProcessed(commandId: string): ResultAsync<void, AppError>
}

/**
 * Creates an idempotency middleware that ensures commands are processed only once.
 * @param store - The store to track processed commands.
 * @returns A middleware function that checks for command idempotency.
 */
export function createIdempotencyMiddleware(
  store: IdempotencyStore
): (command: Command, next: DispatchFn) => CommandResultAsync {
  return (command: Command, next: DispatchFn) => {
    const commandId = command.aggregateId // Using aggregateId as the command identifier

    logger.debug('Checking command idempotency', { commandId })

    return store
      .isProcessed(commandId)
      .andThen(isProcessed => {
        if (isProcessed) {
          logger.warn('Command already processed', { commandId })
          return ResultAsync.fromPromise(
            Promise.reject(
              createConflictError('Command has already been processed', {
                commandId
              })
            ),
            error => error as AppError
          )
        }

        return next(command).andThen(result => {
          return store
            .markAsProcessed(commandId)
            .map(() => result)
            .mapErr(error => {
              logger.error('Failed to mark command as processed', error, {
                commandId
              })
              return error
            })
        })
      })
      .mapErr(error => {
        logger.error('Idempotency check failed', error, { commandId })
        return error
      })
  }
}
