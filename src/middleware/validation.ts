import { errAsync } from 'neverthrow'
import type { DispatchFn, MiddlewareFn } from '../command/bus'
import { createValidationError } from '../types/app-error'
import type { Command } from '../types/command'
import type { CommandResultAsync } from '../types/command'
// import { z } from 'zod'; // 例: Zod を使う場合

/**
 * Validates the command payload (Skeleton).
 * Specific validation logic needs to be implemented based on command operations.
 *
 * @param command - The command being dispatched.
 * @param next - Function to call the next middleware or handler.
 * @returns The result of the command processing, or a validation error.
 */
export const validationMiddleware: MiddlewareFn = (
  command: Command,
  next: DispatchFn
): CommandResultAsync => {
  console.log(
    `[Middleware][Validation] Validating command: ${command.operation} (${command.aggregateId})`
  )

  // --- ここに検証ロジックを実装 ---
  // 例: command.operation に基づいて適切なスキーマを取得・適用
  /*
  const getSchema = (operation: string): z.ZodSchema | undefined => {
      switch(operation) {
          case 'createOrder': return CreateOrderSchema;
          // ... 他のコマンド
          default: return undefined;
      }
  }
  const schema = getSchema(command.operation);
  if (schema) {
      const validationResult = schema.safeParse(command.payload);
      if (!validationResult.success) {
          console.error('[Middleware][Validation] Validation failed:', validationResult.error.errors);
          return errAsync(createValidationError('Command payload validation failed', validationResult.error.flatten()));
      }
      console.log('[Middleware][Validation] Validation successful.');
  } else {
      console.warn(`[Middleware][Validation] No validation schema found for operation: ${command.operation}`);
  }
  */
  // --- 検証ロジックここまで ---

  // 検証が成功したら次の処理へ
  return next(command)
}
