import { ResultAsync } from 'neverthrow'
import type { DispatchFn } from '../command/bus'
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
  constructor(private readonly schema: Record<string, unknown>) {}

  validate(command: Command): ResultAsync<void, AppError> {
    if (!command.payload) {
      return ResultAsync.fromPromise(
        Promise.reject(
          createValidationError('Command payload is required', {
            schema: this.schema
          })
        ),
        error => error as AppError
      )
    }

    // TODO: Implement schema validation using a validation library like Zod
    // For now, we'll just check if the payload is an object
    if (typeof command.payload !== 'object' || command.payload === null) {
      return ResultAsync.fromPromise(
        Promise.reject(
          createValidationError('Command payload must be an object', {
            schema: this.schema,
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
