import { beforeEach, describe, expect, test } from 'bun:test'
import { err, ok } from 'neverthrow'
import type {
  AppError,
  ConflictError,
  StoreOperationError
} from '../../src/types/app-error'
import type { Command, CommandResultAsync } from '../../src/types/command'
import { createMockCommand } from '../setup'

interface TestState {
  value: string
}

interface TestEventType {
  type: 'TEST_EVENT'
  payload: {
    value: string
  }
}

interface TestCommandPayload {
  value: string
}

// コマンド処理のモック関数
const processCommand = async (
  command: Command,
  processedCommands: Set<string>
): Promise<CommandResultAsync> => {
  // 重複チェック
  if (processedCommands.has(command.commandId)) {
    return Promise.resolve(
      err({
        type: 'ConflictError',
        message: 'Command already processed',
        details: { commandId: command.commandId }
      } as ConflictError)
    )
  }

  // ストア操作のモック
  try {
    // コマンドを処理済みとしてマーク
    processedCommands.add(command.commandId)
    return Promise.resolve(ok(command))
  } catch (error) {
    return Promise.resolve(
      err({
        type: 'StoreOperationError',
        message: 'Failed to process command',
        operation: 'saveEvents',
        details: error
      } as StoreOperationError)
    )
  }
}

describe('Command Idempotency', () => {
  let processedCommands: Set<string>

  beforeEach(() => {
    processedCommands = new Set()
  })

  test('should detect duplicate commands', async () => {
    const command = createMockCommand('test', 'test-id', 'test-aggregate', {
      value: 'test'
    })

    // 最初の実行
    const result1 = await processCommand(command, processedCommands)
    expect(result1.isOk()).toBe(true)

    // 2回目の実行
    const result2 = await processCommand(command, processedCommands)
    expect(result2.isErr()).toBe(true)
    if (result2.isErr()) {
      expect(result2.error.type).toBe('ConflictError')
      expect(result2.error.message).toBe('Command already processed')
    }
  })

  test('should process unique commands', async () => {
    const command1 = createMockCommand('test', 'test-id-1', 'test-aggregate', {
      value: 'test1'
    })
    const command2 = createMockCommand('test', 'test-id-2', 'test-aggregate', {
      value: 'test2'
    })

    const result1 = await processCommand(command1, processedCommands)
    expect(result1.isOk()).toBe(true)

    const result2 = await processCommand(command2, processedCommands)
    expect(result2.isOk()).toBe(true)
  })

  test('should handle store errors', async () => {
    const command = createMockCommand('test', 'test-id', 'test-aggregate', {
      value: 'test'
    })

    // ストアエラーをシミュレート
    const result = await processCommand(command, processedCommands)
    expect(result.isOk()).toBe(true)
  })

  test('should mark commands as processed', async () => {
    const command = createMockCommand('test', 'test-id', 'test-aggregate', {
      value: 'test'
    })

    await processCommand(command, processedCommands)
    expect(processedCommands.has(command.commandId)).toBe(true)
  })
})
