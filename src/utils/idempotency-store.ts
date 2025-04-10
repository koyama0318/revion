import { ResultAsync } from 'neverthrow'
import type { AppError } from '../types/app-error'
import { createInternalServerError } from '../types/app-error'
import { logger } from './logger'

/**
 * Interface for idempotency store that persists processed command IDs
 */
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
 * In-memory implementation of the IdempotencyStore for development or testing
 */
export class InMemoryIdempotencyStore implements IdempotencyStore {
  private processedCommands: Set<string> = new Set()

  isProcessed(commandId: string): ResultAsync<boolean, AppError> {
    try {
      const isProcessed = this.processedCommands.has(commandId)
      logger.debug('Checked command idempotency', { commandId, isProcessed })
      return ResultAsync.fromPromise(Promise.resolve(isProcessed), error =>
        createInternalServerError('Failed to check command idempotency', {
          cause: error,
          details: { commandId }
        })
      )
    } catch (error) {
      return ResultAsync.fromPromise(
        Promise.reject(
          createInternalServerError('Failed to check command idempotency', {
            cause: error,
            details: { commandId }
          })
        ),
        e => e as AppError
      )
    }
  }

  markAsProcessed(commandId: string): ResultAsync<void, AppError> {
    try {
      this.processedCommands.add(commandId)
      logger.debug('Marked command as processed', { commandId })
      return ResultAsync.fromPromise(Promise.resolve(), error =>
        createInternalServerError('Failed to mark command as processed', {
          cause: error,
          details: { commandId }
        })
      )
    } catch (error) {
      return ResultAsync.fromPromise(
        Promise.reject(
          createInternalServerError('Failed to mark command as processed', {
            cause: error,
            details: { commandId }
          })
        ),
        e => e as AppError
      )
    }
  }
}

/**
 * TTL-based idempotency store that expires processed command IDs after specified time
 */
export class TTLIdempotencyStore implements IdempotencyStore {
  private processedCommands: Map<string, number> = new Map()
  private readonly ttlMs: number

  /**
   * Create a new TTL-based idempotency store
   * @param ttlMs Time-to-live in milliseconds for processed command IDs
   */
  constructor(ttlMs: number = 24 * 60 * 60 * 1000) {
    // Default: 24 hours
    this.ttlMs = ttlMs

    // Start cleanup process
    setInterval(() => this.cleanupExpiredEntries(), 60 * 1000) // Cleanup every minute
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now()
    for (const [commandId, expiryTime] of this.processedCommands.entries()) {
      if (expiryTime <= now) {
        this.processedCommands.delete(commandId)
        logger.debug('Expired processed command entry', { commandId })
      }
    }
  }

  isProcessed(commandId: string): ResultAsync<boolean, AppError> {
    try {
      const expiryTime = this.processedCommands.get(commandId)
      const isProcessed = expiryTime !== undefined && expiryTime > Date.now()

      logger.debug('Checked command idempotency with TTL', {
        commandId,
        isProcessed,
        expiryTimeLeft: expiryTime
          ? `${Math.floor((expiryTime - Date.now()) / 1000)}s`
          : 'not found'
      })

      return ResultAsync.fromPromise(Promise.resolve(isProcessed), error =>
        createInternalServerError('Failed to check command idempotency', {
          cause: error,
          details: { commandId }
        })
      )
    } catch (error) {
      return ResultAsync.fromPromise(
        Promise.reject(
          createInternalServerError('Failed to check command idempotency', {
            cause: error,
            details: { commandId }
          })
        ),
        e => e as AppError
      )
    }
  }

  markAsProcessed(commandId: string): ResultAsync<void, AppError> {
    try {
      const expiryTime = Date.now() + this.ttlMs
      this.processedCommands.set(commandId, expiryTime)

      logger.debug('Marked command as processed with TTL', {
        commandId,
        expiryTime: new Date(expiryTime).toISOString(),
        ttl: `${this.ttlMs / 1000}s`
      })

      return ResultAsync.fromPromise(Promise.resolve(), error =>
        createInternalServerError('Failed to mark command as processed', {
          cause: error,
          details: { commandId }
        })
      )
    } catch (error) {
      return ResultAsync.fromPromise(
        Promise.reject(
          createInternalServerError('Failed to mark command as processed', {
            cause: error,
            details: { commandId }
          })
        ),
        e => e as AppError
      )
    }
  }
}
