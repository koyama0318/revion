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

// 必要に応じて他のエラー型を追加 (例: ConflictError)
// export type ConflictError = { ... }

/** Union type for all possible application errors in the command side. */
export type AppError = ValidationError | NotFoundError | StoreOperationError
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
