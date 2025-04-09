import { ResultAsync } from 'neverthrow'
import type { AppError } from '../types/app-error'
import type { DomainEvent, DomainEventPayload } from '../types/event'
import type { HandleEventFn } from './handler'

/**
 * Represents a lock manager for concurrency control.
 */
export interface LockManager {
  /**
   * Acquires a lock for a resource.
   * @param resourceId - The ID of the resource to lock.
   * @returns A ResultAsync containing void on success, or an AppError on failure.
   */
  acquireLock(resourceId: string): ResultAsync<void, AppError>

  /**
   * Releases a lock for a resource.
   * @param resourceId - The ID of the resource to unlock.
   * @returns A ResultAsync containing void on success, or an AppError on failure.
   */
  releaseLock(resourceId: string): ResultAsync<void, AppError>
}

/**
 * Creates an in-memory lock manager.
 * @returns A new LockManager instance.
 */
export function createInMemoryLockManager(): LockManager {
  const locks = new Set<string>()

  return {
    acquireLock: (resourceId: string) => {
      if (locks.has(resourceId)) {
        return ResultAsync.fromPromise(
          Promise.reject(new Error(`Resource ${resourceId} is already locked`)),
          error => error as AppError
        )
      }

      locks.add(resourceId)
      return ResultAsync.fromPromise(
        Promise.resolve(),
        error => error as AppError
      )
    },

    releaseLock: (resourceId: string) => {
      locks.delete(resourceId)
      return ResultAsync.fromPromise(
        Promise.resolve(),
        error => error as AppError
      )
    }
  }
}

/**
 * Creates a concurrent event handler.
 * @param handler - The event handler to make concurrent.
 * @param lockManager - The lock manager.
 * @param getResourceId - A function that extracts the resource ID from an event.
 * @returns A new event handler that handles concurrency.
 */
export function withConcurrencyControl(
  handler: HandleEventFn,
  lockManager: LockManager,
  getResourceId: (event: DomainEvent<DomainEventPayload>) => string
): HandleEventFn {
  return (event: DomainEvent<DomainEventPayload>) => {
    const resourceId = getResourceId(event)

    return lockManager.acquireLock(resourceId).andThen(() => {
      return handler(event).andThen(() => {
        return lockManager.releaseLock(resourceId)
      })
    })
  }
}
