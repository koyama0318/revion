// import { type Result, err, ok } from 'neverthrow'
// import { v4 as uuidv4 } from 'uuid'
// import { createInternalError } from './errors'
// import type { AppError } from './types'

// /**
//  * UUIDを生成
//  */
// export function generateUuid(): string {
//   return uuidv4()
// }

// /**
//  * プロミスをResultに変換
//  */
// export async function toResult<T>(
//   promise: Promise<T>,
//   errorMap: (error: unknown) => AppError = defaultErrorMap
// ): Promise<Result<T, AppError>> {
//   try {
//     const result = await promise
//     return ok(result)
//   } catch (error) {
//     return err(errorMap(error))
//   }
// }

// /**
//  * デフォルトのエラーマッピング関数
//  */
// function defaultErrorMap(error: unknown): AppError {
//   if (typeof error === 'object' && error !== null && 'type' in error) {
//     return error as AppError
//   }

//   let message = 'Unknown error'
//   if (error instanceof Error) {
//     message = error.message
//   } else if (typeof error === 'string') {
//     message = error
//   }

//   return createInternalError(message, error)
// }

// /**
//  * ディープマージ
//  */
// export function deepMerge<T>(target: T, source: Partial<T>): T {
//   const output = { ...target }

//   if (isObject(target) && isObject(source)) {
//     // biome-ignore lint/complexity/noForEach: <explanation>
//     Object.keys(source).forEach(key => {
//       const sourceValue = source[key as keyof typeof source]
//       if (isObject(sourceValue)) {
//         if (!(key in target)) {
//           // @ts-ignore
//           Object.assign(output, { [key]: sourceValue })
//         } else {
//           // @ts-ignore
//           output[key] = deepMerge(target[key], sourceValue as Partial<unknown>)
//         }
//       } else {
//         // @ts-ignore
//         Object.assign(output, { [key]: sourceValue })
//       }
//     })
//   }

//   return output
// }

// /**
//  * オブジェクトかどうかをチェック
//  */
// function isObject(item: unknown): item is Record<string, unknown> {
//   return item !== null && typeof item === 'object' && !Array.isArray(item)
// }

// /**
//  * オブジェクトをフラット化する
//  */
// export function flattenObject(
//   obj: Record<string, unknown>,
//   prefix = ''
// ): Record<string, unknown> {
//   return Object.keys(obj).reduce(
//     (acc, key) => {
//       const prefixedKey = prefix ? `${prefix}.${key}` : key

//       if (isObject(obj[key])) {
//         Object.assign(
//           acc,
//           flattenObject(obj[key] as Record<string, unknown>, prefixedKey)
//         )
//       } else {
//         acc[prefixedKey] = obj[key]
//       }

//       return acc
//     },
//     {} as Record<string, unknown>
//   )
// }

// /**
//  * 現在のタイムスタンプを取得
//  */
// export function now(): Date {
//   return new Date()
// }

// /**
//  * 指定した時間後に解決するPromiseを返す
//  */
// export function sleep(ms: number): Promise<void> {
//   return new Promise(resolve => setTimeout(resolve, ms))
// }

// /**
//  * 文字列がJSONかどうかを判定
//  */
// export function isJsonString(str: string): boolean {
//   try {
//     JSON.parse(str)
//     return true
//   } catch (e) {
//     return false
//   }
// }

// /**
//  * オブジェクトをJSON文字列に変換（エラーハンドリング付き）
//  */
// export function safeStringify<T>(
//   obj: T,
//   space?: number
// ): Result<string, AppError> {
//   try {
//     return ok(JSON.stringify(obj, null, space))
//   } catch (error) {
//     return err(createInternalError('Failed to stringify object', error))
//   }
// }

// /**
//  * JSON文字列をオブジェクトに変換（エラーハンドリング付き）
//  */
// export function safeParse<T>(jsonString: string): Result<T, AppError> {
//   try {
//     return ok(JSON.parse(jsonString) as T)
//   } catch (error) {
//     return err(createInternalError('Failed to parse JSON string', error))
//   }
// }

// /**
//  * イベントストリーミングのリプレイを一時的に停止する関数
//  * サーバー負荷を抑えるための簡易レート制限
//  */
// export async function throttle(
//   itemsProcessed: number,
//   batchSize = 100,
//   pauseMs = 50
// ): Promise<void> {
//   if (itemsProcessed % batchSize === 0 && itemsProcessed > 0) {
//     await sleep(pauseMs)
//   }
// }
