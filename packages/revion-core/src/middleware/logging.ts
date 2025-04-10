import type { DispatchFn, MiddlewareFn } from '../command/command-bus'
import type { Command } from '../types/command'
import type { CommandResultAsync } from '../types/command'

/**
 * Logs the start and end of command processing.
 *
 * @param command - The command being dispatched.
 * @param next - Function to call the next middleware or handler.
 * @returns The result of the command processing.
 */
export const loggingMiddleware: MiddlewareFn = (
  command: Command,
  next: DispatchFn
): CommandResultAsync => {
  console.log(
    `[Middleware][Logging] Dispatching command: ${command.operation} (${command.aggregateId})`
  )

  // 次のミドルウェアまたはハンドラーを呼び出す
  const result = next(command)

  // 結果を非同期で処理してログを出力
  return result
    .map(value => {
      console.log(
        `[Middleware][Logging] Command processed successfully: ${command.operation} (${command.aggregateId})`
      )
      return value // 成功値をそのまま返す
    })
    .mapErr(error => {
      console.error(
        `[Middleware][Logging] Error processing command: ${command.operation} (${command.aggregateId})`,
        error
      )
      return error // エラーをそのまま返す
    })
}
