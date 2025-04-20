import { describe, expect, it } from 'bun:test'
import { CommandBus } from '../../src/command/command-bus'
import type { Command } from '../../src/types/command'
import type { CommandMiddleware } from '../../src/types/command-bus'
import type { CommandHandler } from '../../src/types/command-bus'
import { ok } from '../../src/utils/result'

const mockCommand: Command = {
  operation: 'doSomething',
  aggregateId: 'test#01963f1e-96b3-7000-944d-68549ad889a2',
  payload: {}
}

function setupHandlers(): Record<string, CommandHandler> {
  return { test: async _ => ok(undefined) }
}

describe('CommandBus', () => {
  it('should call handler if valid command is dispatched', async () => {
    const bus = new CommandBus(setupHandlers(), [])
    const result = await bus.dispatch(mockCommand)

    expect(result.ok).toBe(true)
    expect(result).toEqual(ok(undefined))
  })

  it('should apply middleware in correct order', async () => {
    const order: string[] = []
    const middleware1: CommandMiddleware = (cmd, next) => {
      order.push('middleware1')
      return next(cmd)
    }
    const middleware2: CommandMiddleware = (cmd, next) => {
      order.push('middleware2')
      return next(cmd)
    }

    const bus = new CommandBus(setupHandlers(), [middleware1, middleware2])
    const result = await bus.dispatch(mockCommand)

    expect(result.ok).toBe(true)
    expect(order).toEqual(['middleware1', 'middleware2'])
  })

  it('should return error if operation is empty', async () => {
    const invalidCommand = { ...mockCommand, operation: '' }
    const bus = new CommandBus(setupHandlers(), [])
    const result = await bus.dispatch(invalidCommand)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_OPERATION')
    }
  })

  it('should return error if aggregateId is invalid', async () => {
    const invalidCommand = { ...mockCommand, aggregateId: 'invalid' }
    const bus = new CommandBus(setupHandlers(), [])
    const result = await bus.dispatch(invalidCommand as Command)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_AGGREGATE_ID')
    }
  })

  it('should return error if handler for aggregate type is not found', async () => {
    const bus = new CommandBus({}, [])
    const result = await bus.dispatch(mockCommand)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('HANDLER_NOT_FOUND')
    }
  })
})
