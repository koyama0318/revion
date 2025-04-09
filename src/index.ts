// Command Bus & Handler
export { createCommandBus } from './command/bus'
export type {
  CommandBus,
  MiddlewareFn,
  DispatchFn,
  RegisterHandlerFn
} from './command/bus'
export { createCommandHandler } from './command/handler'
export type { ProcessCommandFn } from './command/handler'

// Functional Aggregate Helpers (if they are intended for public use)
export {
  decideAndReduce,
  reconstructState
} from './command/functional-aggregate'

// Middleware Examples (exporting them might be optional)
export { loggingMiddleware } from './middleware/logging'
export { validationMiddleware } from './middleware/validation'
export { performanceMiddleware } from './middleware/performance'

// Core Types
export type {
  AppError,
  ValidationError,
  NotFoundError,
  StoreOperationError
} from './types/app-error'
export {
  createValidationError,
  createNotFoundError,
  createStoreOperationError
} from './types/app-error'
export type { Command, CommandResultAsync } from './types/command'
export type { State, EventDecider, Reducer } from './types/command-aggregate'
// export type { ICommandAggregate } from './types/command-aggregate' // Interface might not be needed if using functional approach
export type { DomainEvent, DomainEventPayload } from './types/event'
export type { EventStore } from './types/event-store'
export type { AggregateId, AggregateType } from './types/id'
export type { Snapshot } from './types/snapshot'

// Utility Functions (if intended for public use)
export { generateUuid } from './utils/id'
