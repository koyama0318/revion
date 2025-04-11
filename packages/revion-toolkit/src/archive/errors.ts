// import type {
//   AppError,
//   EventHandlerError,
//   StoreError,
//   ValidationError
// } from './types'

// /**
//  * バリデーションエラーを作成
//  */
// export function createValidationError(
//   message: string,
//   fieldErrors?: Record<string, string[]>,
//   details?: Record<string, unknown>
// ): ValidationError {
//   return {
//     type: 'ValidationError',
//     message,
//     fieldErrors,
//     details
//   }
// }

// /**
//  * ストア操作エラーを作成
//  */
// export function createStoreError(
//   message: string,
//   operation: string,
//   details?: Record<string, unknown>
// ): StoreError {
//   return {
//     type: 'StoreError',
//     message,
//     operation,
//     details
//   }
// }

// /**
//  * イベントハンドリングエラーを作成
//  */
// export function createEventHandlerError(
//   message: string,
//   eventType: string,
//   details?: Record<string, unknown>
// ): EventHandlerError {
//   return {
//     type: 'EventHandlerError',
//     message,
//     eventType,
//     details
//   }
// }

// /**
//  * コマンドエラー
//  */
// export interface CommandError extends AppError {
//   type: 'CommandError'
//   commandType?: string
// }

// /**
//  * コマンドエラーを作成
//  */
// export function createCommandError(
//   message: string,
//   commandType?: string,
//   details?: Record<string, unknown>
// ): CommandError {
//   return {
//     type: 'CommandError',
//     message,
//     commandType,
//     details
//   }
// }

// /**
//  * 不正な状態エラー
//  */
// export interface InvalidStateError extends AppError {
//   type: 'InvalidStateError'
//   expectedState?: string
//   actualState?: string
// }

// /**
//  * 不正な状態エラーを作成
//  */
// export function createInvalidStateError(
//   message: string,
//   expectedState?: string,
//   actualState?: string,
//   details?: Record<string, unknown>
// ): InvalidStateError {
//   return {
//     type: 'InvalidStateError',
//     message,
//     expectedState,
//     actualState,
//     details
//   }
// }

// /**
//  * 内部エラー
//  */
// export interface InternalError extends AppError {
//   type: 'InternalError'
// }

// /**
//  * 内部エラーを作成
//  */
// export function createInternalError(
//   message: string,
//   cause?: unknown,
//   details?: Record<string, unknown>
// ): InternalError {
//   return {
//     type: 'InternalError',
//     message,
//     cause,
//     details
//   }
// }

// /**
//  * エラーをチェックするユーティリティ関数
//  */
// export function isError<T extends AppError>(
//   error: AppError,
//   type: T['type']
// ): error is T {
//   return error.type === type
// }

// /**
//  * エラーメッセージをコンソールに表示（デバッグ用）
//  */
// export function printError(error: AppError): void {
//   console.error(`Error [${error.type}]: ${error.message}`)

//   if (error.details) {
//     console.error('Details:', error.details)
//   }

//   if (error.cause) {
//     console.error('Cause:', error.cause)
//   }
// }
