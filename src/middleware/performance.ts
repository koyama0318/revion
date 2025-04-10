import type { DispatchFn, MiddlewareFn } from '../command/command-bus'
import type { Command } from '../types/command'
import type { CommandResultAsync } from '../types/command'

/**
 * Measures and logs the execution time of command processing.
 *
 * @param command - The command being dispatched.
 * @param next - Function to call the next middleware or handler.
 * @returns The result of the command processing.
 */
export const performanceMiddleware: MiddlewareFn = (
  command: Command,
  next: DispatchFn
): CommandResultAsync => {
  const startTime = performance.now()
  console.log(
    `[Middleware][Performance] Start processing command: ${command.operation} (${command.aggregateId})`
  )

  const result = next(command)

  const logEndTime = () => {
    const endTime = performance.now()
    const duration = endTime - startTime
    console.log(
      `[Middleware][Performance] Finished processing command: ${command.operation} (${command.aggregateId}). Duration: ${duration.toFixed(2)} ms`
    )
  }

  return result
    .map(value => {
      logEndTime()
      return value
    })
    .mapErr(error => {
      logEndTime()
      return error
    })
}
