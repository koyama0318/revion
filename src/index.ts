// Command Bus & Handler
export { createCommandBus } from './command/command-bus'
export type {
  CommandBus,
  MiddlewareFn,
  DispatchFn,
  RegisterHandlerFn
} from './command/command-bus'
export { createCommandHandler } from './command/command-handler'
export type { ProcessCommandFn } from './command/command-handler'

// Query Bus & Handler
export { createQueryBus } from './query/query-bus'
export type { QueryBus } from './query/query-bus'
export { createQueryHandler } from './query/query-handler'
export type { HandleQueryFn } from './query/query-handler'

// Functional Aggregate Helpers
export {
  decideAndReduce,
  reconstructState
} from './command/functional-aggregate'

// Saga
export { SagaManager } from './command/saga'
export type { SagaStep, SagaDefinition } from './command/saga'

// Middleware
export { loggingMiddleware } from './middleware/logging'
export { createValidationMiddleware } from './middleware/validation'
export type {
  ValidationRule,
  RequiredFieldsRule,
  PayloadSchemaRule
} from './middleware/validation'
export { performanceMiddleware } from './middleware/performance'

// Core Types
export type {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  PermissionDeniedError,
  InternalServerError,
  StoreOperationError
} from './types/app-error'
export {
  createValidationError,
  createNotFoundError,
  createConflictError,
  createPermissionDeniedError,
  createInternalServerError,
  createStoreOperationError
} from './types/app-error'
export type { Command, CommandResultAsync } from './types/command'
export type { State, EventDecider, Reducer } from './types/command-aggregate'
export type { DomainEvent, DomainEventPayload } from './types/domain-event'
export type { EventStore } from './types/event-store'
export type { AggregateId, AggregateType } from './types/aggregate-id'
export type { Snapshot } from './types/snapshot'
export type { Query, QueryResult } from './types/query'

// Logger
export { logger } from './utils/logger'
export type { Logger, LogLevel, LogContext } from './utils/logger'

// Utility Functions
export { generateUuid } from './utils/id'
