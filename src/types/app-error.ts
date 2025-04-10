/** Validation Error details. */
export type ValidationError = {
  readonly type: 'ValidationError'
  readonly message: string
  readonly details?: unknown
}

/** Not Found Error details. */
export type NotFoundError = {
  readonly type: 'NotFoundError'
  readonly message: string
  readonly details?: unknown
}

/** Conflict Error details. */
export type ConflictError = {
  readonly type: 'ConflictError'
  readonly message: string
  readonly details?: unknown
}

/** Permission Denied Error details. */
export type PermissionDeniedError = {
  readonly type: 'PermissionDeniedError'
  readonly message: string
  readonly details?: unknown
}

/** Internal Server Error details. */
export type InternalServerError = {
  readonly type: 'InternalServerError'
  readonly message: string
  readonly details?: unknown
  readonly cause?: unknown
}

/** Error during EventStore operation. */
export type StoreOperationError = {
  readonly type: 'StoreOperationError'
  readonly message: string
  /** The specific operation that failed. */
  readonly operation:
    | 'loadHistory'
    | 'loadSnapshot'
    | 'saveEvents'
    | 'saveSnapshot'
  readonly details?: unknown
  /** The original error causing this one. */
  readonly cause?: unknown
}

/** Timeout Error details. */
export type TimeoutError = {
  readonly type: 'TimeoutError'
  readonly message: string
  /** The operation that timed out */
  readonly operation: string
  /** The timeout duration in milliseconds */
  readonly timeoutMs: number
  readonly details?: unknown
}

/** Network Error details. */
export type NetworkError = {
  readonly type: 'NetworkError'
  readonly message: string
  /** The URL or endpoint that failed */
  readonly endpoint?: string
  /** HTTP status code if available */
  readonly statusCode?: number
  readonly details?: unknown
  readonly cause?: unknown
}

/** Dependency Error details - when a required dependency failed. */
export type DependencyError = {
  readonly type: 'DependencyError'
  readonly message: string
  /** The name of the dependency that failed */
  readonly dependencyName: string
  readonly details?: unknown
  readonly cause?: unknown
}

/** Data Integrity Error details - when data is corrupted or in an invalid state. */
export type DataIntegrityError = {
  readonly type: 'DataIntegrityError'
  readonly message: string
  /** The entity type with integrity issues */
  readonly entityType?: string
  /** The entity ID with integrity issues */
  readonly entityId?: string
  readonly details?: unknown
}

/** Command Execution Error details - specific to command execution failures. */
export type CommandExecutionError = {
  readonly type: 'CommandExecutionError'
  readonly message: string
  /** The aggregate type of the command */
  readonly aggregateType: string
  /** The operation being executed */
  readonly operation: string
  /** The aggregate ID */
  readonly aggregateId: string
  readonly details?: unknown
  readonly cause?: unknown
}

// 必要に応じて他のエラー型を追加 (例: ConflictError)
// export type ConflictError = { ... }

/** Union type for all possible application errors in the command side. */
export type AppError =
  | ValidationError
  | NotFoundError
  | ConflictError
  | PermissionDeniedError
  | InternalServerError
  | StoreOperationError
  | TimeoutError
  | NetworkError
  | DependencyError
  | DataIntegrityError
  | CommandExecutionError
// | ConflictError など

/**
 * Creates a ValidationError object.
 * @param message - The error message.
 * @param details - Optional additional details.
 * @returns A ValidationError object.
 */
export function createValidationError(
  message: string,
  details?: unknown
): ValidationError {
  return { type: 'ValidationError', message, details }
}

/**
 * Creates a NotFoundError object.
 * @param message - The error message.
 * @param details - Optional additional details.
 * @returns A NotFoundError object.
 */
export function createNotFoundError(
  message: string,
  details?: unknown
): NotFoundError {
  return { type: 'NotFoundError', message, details }
}

/**
 * Creates a ConflictError object.
 * @param message - The error message.
 * @param details - Optional additional details.
 * @returns A ConflictError object.
 */
export function createConflictError(
  message: string,
  details?: unknown
): ConflictError {
  return { type: 'ConflictError', message, details }
}

/**
 * Creates a PermissionDeniedError object.
 * @param message - The error message.
 * @param details - Optional additional details.
 * @returns A PermissionDeniedError object.
 */
export function createPermissionDeniedError(
  message: string,
  details?: unknown
): PermissionDeniedError {
  return { type: 'PermissionDeniedError', message, details }
}

/**
 * Creates an InternalServerError object.
 * @param message - The error message.
 * @param options - Optional details and cause.
 * @returns An InternalServerError object.
 */
export function createInternalServerError(
  message: string,
  options?: { details?: unknown; cause?: unknown }
): InternalServerError {
  return {
    type: 'InternalServerError',
    message,
    details: options?.details,
    cause: options?.cause
  }
}

/**
 * Creates a StoreOperationError object.
 * @param message - The error message.
 * @param operation - The store operation that failed.
 * @param options - Optional details and cause.
 * @returns A StoreOperationError object.
 */
export function createStoreOperationError(
  message: string,
  operation: StoreOperationError['operation'],
  options?: { details?: unknown; cause?: unknown }
): StoreOperationError {
  return {
    type: 'StoreOperationError',
    message,
    operation,
    details: options?.details,
    cause: options?.cause
  }
}

/**
 * Creates a TimeoutError object.
 * @param message - The error message.
 * @param operation - The operation that timed out.
 * @param timeoutMs - The timeout duration in milliseconds.
 * @param details - Optional additional details.
 * @returns A TimeoutError object.
 */
export function createTimeoutError(
  message: string,
  operation: string,
  timeoutMs: number,
  details?: unknown
): TimeoutError {
  return {
    type: 'TimeoutError',
    message,
    operation,
    timeoutMs,
    details
  }
}

/**
 * Creates a NetworkError object.
 * @param message - The error message.
 * @param options - Optional endpoint, status code, details, and cause.
 * @returns A NetworkError object.
 */
export function createNetworkError(
  message: string,
  options?: {
    endpoint?: string
    statusCode?: number
    details?: unknown
    cause?: unknown
  }
): NetworkError {
  return {
    type: 'NetworkError',
    message,
    endpoint: options?.endpoint,
    statusCode: options?.statusCode,
    details: options?.details,
    cause: options?.cause
  }
}

/**
 * Creates a DependencyError object.
 * @param message - The error message.
 * @param dependencyName - The name of the dependency that failed.
 * @param options - Optional details and cause.
 * @returns A DependencyError object.
 */
export function createDependencyError(
  message: string,
  dependencyName: string,
  options?: { details?: unknown; cause?: unknown }
): DependencyError {
  return {
    type: 'DependencyError',
    message,
    dependencyName,
    details: options?.details,
    cause: options?.cause
  }
}

/**
 * Creates a DataIntegrityError object.
 * @param message - The error message.
 * @param options - Optional entity type, entity ID, and details.
 * @returns A DataIntegrityError object.
 */
export function createDataIntegrityError(
  message: string,
  options?: { entityType?: string; entityId?: string; details?: unknown }
): DataIntegrityError {
  return {
    type: 'DataIntegrityError',
    message,
    entityType: options?.entityType,
    entityId: options?.entityId,
    details: options?.details
  }
}

/**
 * Creates a CommandExecutionError object.
 * @param message - The error message.
 * @param command - The command details.
 * @param options - Optional details and cause.
 * @returns A CommandExecutionError object.
 */
export function createCommandExecutionError(
  message: string,
  command: {
    aggregateType: string
    operation: string
    aggregateId: string
  },
  options?: { details?: unknown; cause?: unknown }
): CommandExecutionError {
  return {
    type: 'CommandExecutionError',
    message,
    aggregateType: command.aggregateType,
    operation: command.operation,
    aggregateId: command.aggregateId,
    details: options?.details,
    cause: options?.cause
  }
}
