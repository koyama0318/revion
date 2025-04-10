import { beforeEach, describe, expect, test } from 'bun:test'
import { okAsync } from 'neverthrow'
import type {
  AggregateId,
  AggregateType,
  Command,
  CommandResultAsync
} from '../../src'
import {
  type DispatchFn,
  createCommandBus
} from '../../src/command/command-bus'
import { createMockCommand } from '../setup'

describe('CommandBus', () => {
  let commandBus: ReturnType<typeof createCommandBus>
  const testAggregateType = 'test-aggregate' as AggregateType
  const testAggregateId = 'test-id' as AggregateId

  beforeEach(() => {
    commandBus = createCommandBus()
  })

  test('should register command handler successfully', () => {
    const handler = (command: Command): CommandResultAsync => {
      return okAsync(undefined)
    }

    commandBus.register(testAggregateType, handler)
  })

  test('should dispatch command to correct handler', async () => {
    const mockHandler = (command: Command): CommandResultAsync => {
      return okAsync(undefined)
    }
    commandBus.register(testAggregateType, mockHandler)

    const command = createMockCommand(
      'test-command',
      testAggregateType,
      testAggregateId,
      { data: 'test' }
    )
    const result = await commandBus.dispatch(command)

    expect(result.isOk()).toBe(true)
  })

  test('should handle unknown command type', async () => {
    const command = createMockCommand(
      'unknown-command',
      testAggregateType,
      testAggregateId,
      { data: 'test' }
    )

    const result = await commandBus.dispatch(command)
    expect(result.isErr()).toBe(true)
  })

  test('should apply middleware in correct order', async () => {
    const middlewareCalls: string[] = []

    const middleware1 = (
      command: Command,
      next: DispatchFn
    ): CommandResultAsync => {
      middlewareCalls.push('middleware1-before')
      return next(command).map(result => {
        middlewareCalls.push('middleware1-after')
        return result
      })
    }

    const middleware2 = (
      command: Command,
      next: DispatchFn
    ): CommandResultAsync => {
      middlewareCalls.push('middleware2-before')
      return next(command).map(result => {
        middlewareCalls.push('middleware2-after')
        return result
      })
    }

    const handler = (command: Command): CommandResultAsync => {
      middlewareCalls.push('handler')
      return okAsync(undefined)
    }

    commandBus.use(middleware1)
    commandBus.use(middleware2)
    commandBus.register(testAggregateType, handler)

    const command = createMockCommand(
      'test-command',
      testAggregateType,
      testAggregateId,
      { data: 'test' }
    )
    await commandBus.dispatch(command)

    expect(middlewareCalls).toEqual([
      'middleware1-before',
      'middleware2-before',
      'handler',
      'middleware2-after',
      'middleware1-after'
    ])
  })

  test('should handle handler registration conflicts', async () => {
    const handler1 = (command: Command): CommandResultAsync => {
      return okAsync(undefined)
    }
    const handler2 = (command: Command): CommandResultAsync => {
      return okAsync(undefined)
    }

    commandBus.register(testAggregateType, handler1)
    expect(() => {
      commandBus.register(testAggregateType, handler2)
    }).toThrow()
  })
})
