import type { AsyncResult } from '../utils/result'
import type { DomainEvent } from './command'
import type { AppError } from './error'
import type { ReadStorage } from './read-storage'

export type EventHandler = (event: DomainEvent) => AsyncResult<void, AppError>

export type EventHandlerFactory = (readStorage: ReadStorage) => EventHandler
