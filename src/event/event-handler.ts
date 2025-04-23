import type { DomainEvent } from '../types/command'
import type { LiteDomainEvent } from '../types/command-lite'
import type { AppError } from '../types/error'
import type { EventHandler, EventHandlerFactory } from '../types/event'
import type { ReadStorage } from '../types/read-storage'
import type { AsyncResult } from '../utils/result'

export const createEventHandler = <E extends LiteDomainEvent>(
  projection: (readStorage: ReadStorage, event: E) => AsyncResult<void, AppError>
): EventHandlerFactory => {
  return (readStorage: ReadStorage): EventHandler => {
    return async (event: DomainEvent): AsyncResult<void, AppError> => {
      return projection(readStorage, event as unknown as E)
    }
  }
}
