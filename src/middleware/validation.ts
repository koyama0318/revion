import { ResultAsync } from 'neverthrow'
import type { z } from 'zod'
import type { DispatchFn } from '../command/command-bus'
import type { AppError } from '../types/app-error'
import { createValidationError } from '../types/app-error'
import type { Command, CommandResultAsync } from '../types/command'
import { logger } from '../utils/logger'

export interface ValidationRule {
  validate(command: Command): ResultAsync<void, AppError>
}

export class RequiredFieldsRule implements ValidationRule {
  constructor(private readonly requiredFields: string[]) {}

  validate(command: Command): ResultAsync<void, AppError> {
    const missingFields = this.requiredFields.filter(
      field => !(field in command)
    )

    if (missingFields.length > 0) {
      return ResultAsync.fromPromise(
        Promise.reject(
          createValidationError(
            `Missing required fields: ${missingFields.join(', ')}`,
            { missingFields }
          )
        ),
        error => error as AppError
      )
    }

    return ResultAsync.fromPromise(
      Promise.resolve(),
      error => error as AppError
    )
  }
}

export class PayloadSchemaRule implements ValidationRule {
  private readonly zodSchema: z.ZodType

  constructor(schema: z.ZodType) {
    this.zodSchema = schema
  }

  validate(command: Command): ResultAsync<void, AppError> {
    if (!command.payload) {
      return ResultAsync.fromPromise(
        Promise.reject(
          createValidationError('Command payload is required', {
            command
          })
        ),
        error => error as AppError
      )
    }

    const result = this.zodSchema.safeParse(command.payload)

    if (!result.success) {
      const formattedErrors = result.error.format()
      return ResultAsync.fromPromise(
        Promise.reject(
          createValidationError('Command payload validation failed', {
            errors: formattedErrors,
            payload: command.payload
          })
        ),
        error => error as AppError
      )
    }

    return ResultAsync.fromPromise(
      Promise.resolve(),
      error => error as AppError
    )
  }
}

/**
 * Helper function to create a validation rule for a specific command type
 * @param schema The Zod schema to validate against
 * @returns A PayloadSchemaRule instance
 */
export function createSchemaValidator<T>(
  schema: z.ZodType<T>
): PayloadSchemaRule {
  return new PayloadSchemaRule(schema)
}

export function createValidationMiddleware(
  rules: ValidationRule[]
): (command: Command, next: DispatchFn) => CommandResultAsync {
  return (command: Command, next: DispatchFn) => {
    logger.debug('Validating command', { command })

    // Apply all validation rules
    return rules
      .reduce<ResultAsync<void, AppError>>(
        (result, rule) => result.andThen(() => rule.validate(command)),
        ResultAsync.fromPromise(Promise.resolve(), error => error as AppError)
      )
      .andThen(() => {
        logger.info('Command validation successful', { command })
        return next(command)
      })
      .mapErr(error => {
        logger.error('Command validation failed', error, { command })
        return error
      })
  }
}
