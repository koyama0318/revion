// import { type Result, err, ok } from 'neverthrow'
// import type { AppError, ValidationError } from 'revion-core'
// import type { z } from 'zod'

// /**
//  * Zodスキーマからバリデータを作成
//  */
// export type Validator<T> = (data: unknown) => Result<T, ValidationError>

// /**
//  * ValidationErrorを作成するヘルパー関数
//  */
// function createValidationError(
//   message: string,
//   fieldErrors: Record<string, string[]> = {},
//   details: Record<string, unknown> = {}
// ): ValidationError {
//   return {
//     type: 'ValidationError',
//     message,
//     details: {
//       ...details,
//       fieldErrors
//     }
//   }
// }

// /**
//  * Zodスキーマからバリデータを作成する関数
//  */
// export function createValidator<T>(schema: z.ZodType<T>): Validator<T> {
//   return (data: unknown) => {
//     const result = schema.safeParse(data)
//     if (result.success) {
//       return ok<T, ValidationError>(result.data)
//     }

//     const formatted = result.error.format()

//     // フィールドエラーの抽出
//     const fieldErrors = Object.entries(formatted)
//       .filter(([key]) => key !== '_errors')
//       .reduce(
//         (acc, [key, value]) => {
//           if (value && '_errors' in value) {
//             acc[key] = value._errors
//           }
//           return acc
//         },
//         {} as Record<string, string[]>
//       )

//     return err<T, ValidationError>(
//       createValidationError('Validation failed', fieldErrors, {
//         zodErrors: result.error.errors
//       })
//     )
//   }
// }

// /**
//  * オブジェクトをバリデーション
//  */
// export function validate<T>(
//   data: unknown,
//   schema: z.ZodType<T>
// ): Result<T, ValidationError> {
//   const validator = createValidator(schema)
//   return validator(data)
// }

// /**
//  * オブジェクトのプロパティをバリデーション
//  */
// export function validateField<T>(
//   fieldName: string,
//   value: unknown,
//   schema: z.ZodType<T>
// ): Result<T, ValidationError> {
//   const validator = createValidator(schema)
//   const result = validator(value)

//   if (result.isErr()) {
//     // fieldNameでエラーを包む
//     const { details } = result.error
//     const fieldErrorsMap =
//       details && typeof details === 'object' && 'fieldErrors' in details
//         ? (details.fieldErrors as Record<string, string[]>)
//         : {}

//     const fieldErrors = {
//       [fieldName]: fieldErrorsMap[fieldName] || ['Invalid value']
//     }

//     return err(
//       createValidationError('Field validation failed', fieldErrors, {
//         originalError: result.error
//       })
//     )
//   }

//   return result
// }
