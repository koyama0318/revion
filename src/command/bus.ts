import { ResultAsync, errAsync } from 'neverthrow'
import { createNotFoundError, createValidationError } from '../types/app-error'
import type { Command, CommandResultAsync } from '../types/command'
import type { ProcessCommandFn } from './handler'

/** Type definition for a function that dispatches a command. */
export type DispatchFn = (command: Command) => CommandResultAsync

/** Type definition for a function that registers a command handler for a specific aggregate type. */
export type RegisterHandlerFn = (
  aggregateType: string,
  handler: ProcessCommandFn
) => void

/** Represents the command bus, providing dispatch and registration capabilities. */
export interface CommandBus {
  /** Dispatches a command to its registered handler, potentially through middleware. */
  dispatch: DispatchFn
  /** Registers a handler function for a specific aggregate type. */
  register: RegisterHandlerFn
}

/**
 * Type definition for a command bus middleware function.
 * Middlewares are executed in order before the command handler.
 * @param command - The command being dispatched.
 * @param next - A function to call the next middleware or the final command handler.
 * @returns The result of the command processing.
 */
export type MiddlewareFn = (
  command: Command,
  next: DispatchFn
) => CommandResultAsync

/**
 * Creates a new CommandBus instance.
 * @param middlewares - An optional array of middleware functions to apply.
 *                      Middlewares are executed in the order they appear in the array.
 * @returns A CommandBus object with `dispatch` and `register` methods.
 */
export function createCommandBus(middlewares: MiddlewareFn[] = []): CommandBus {
  const commandHandlers = new Map<string, ProcessCommandFn>()

  const register: RegisterHandlerFn = (aggregateType, handler) => {
    if (commandHandlers.has(aggregateType)) {
      console.warn(
        `Handler for aggregate type "${aggregateType}" already registered. Overwriting.`
      )
    }
    commandHandlers.set(aggregateType, handler)
  }

  // Internal function to actually call the registered handler.
  const actualDispatch: DispatchFn = command => {
    if (command.operation === '') {
      return errAsync(createValidationError('Operation cannot be empty'))
    }
    const key = command.aggregateType
    const handler = commandHandlers.get(key)
    if (!handler) {
      return errAsync(
        createNotFoundError(
          `No handler found for command aggregate type "${key}"`
        )
      )
    }
    // Executes the specific command handler.
    return handler(command).mapErr(originalError => {
      // Basic error logging for handler execution errors.
      // Consider replacing with a proper logging abstraction.
      console.error(
        '[CommandBus] Error during handler execution:',
        originalError
      )
      return originalError
    })
  }

  // Builds the middleware chain using reduceRight.
  // The last middleware calls `actualDispatch`.
  const dispatchWithMiddleware: DispatchFn =
    middlewares.reduceRight<DispatchFn>(
      (nextMiddlewareOrHandler, currentMiddleware) => {
        // Curry the `next` function for the current middleware.
        return (command: Command) =>
          currentMiddleware(command, nextMiddlewareOrHandler)
      },
      actualDispatch
    )

  return {
    dispatch: dispatchWithMiddleware,
    register
  }
}
