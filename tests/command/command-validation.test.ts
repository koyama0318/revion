import { beforeEach, describe, expect, test } from 'bun:test'
import { type Result, err, ok } from 'neverthrow'
import type {
  AggregateId,
  AggregateType,
  Command,
  CommandResultAsync
} from '../../src'
import { createCommandHandler } from '../../src/command/command-handler'
import { createValidationError } from '../../src/types/app-error'
import type { AppError } from '../../src/types/app-error'
import type { State } from '../../src/types/command-aggregate'
import type {
  DomainEvent,
  DomainEventPayload
} from '../../src/types/domain-event'
import type { EventStore } from '../../src/types/event-store'
import { createMockCommand } from '../setup'

interface TestState extends State {
  id: string
  name: string
  counter: number
  aggregateType: string
  aggregateId: string
}

type TestEventType = 'TestCreated' | 'CounterIncremented'

interface TestEventPayload extends DomainEventPayload {
  readonly eventType: TestEventType
  readonly name?: string
}

interface TestEvent extends DomainEvent<TestEventPayload> {
  eventType: TestEventType
  payload: TestEventPayload
}

interface TestCommandPayload {
  name?: string | number
}

describe('Command Validation', () => {
  let aggregateId: AggregateId
  let aggregateType: AggregateType

  beforeEach(() => {
    aggregateId = 'test-id' as AggregateId
    aggregateType = 'test-aggregate' as AggregateType
  })

  test('should validate required fields', async () => {
    const command = createMockCommand(
      'TestCommand',
      'test-aggregate',
      'test-id',
      {} as TestCommandPayload
    )

    const validateCommand = (command: Command): Result<Command, AppError> => {
      const payload = command.payload as TestCommandPayload
      if (!payload.name) {
        return err({
          type: 'ValidationError',
          message: 'Name is required',
          details: { field: 'name' }
        })
      }
      return ok(command)
    }

    const result = validateCommand(command)
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('ValidationError')
      expect(result.error.message).toBe('Name is required')
    }
  })

  test('should validate payload schema', async () => {
    const command = createMockCommand(
      'TestCommand',
      'test-aggregate',
      'test-id',
      { name: 123 } as TestCommandPayload
    )

    const validateCommand = (command: Command): Result<Command, AppError> => {
      const payload = command.payload as TestCommandPayload
      if (typeof payload.name !== 'string') {
        return err({
          type: 'ValidationError',
          message: 'Name must be a string',
          details: { field: 'name' }
        })
      }
      return ok(command)
    }

    const result = validateCommand(command)
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('ValidationError')
      expect(result.error.message).toBe('Name must be a string')
    }
  })

  test('should handle missing payload', async () => {
    const command = createMockCommand(
      'TestCommand',
      'test-aggregate',
      'test-id',
      undefined as unknown as TestCommandPayload
    )

    const validateCommand = (command: Command): Result<Command, AppError> => {
      if (!command.payload) {
        return err({
          type: 'ValidationError',
          message: 'Payload is required',
          details: { field: 'payload' }
        })
      }
      return ok(command)
    }

    const result = validateCommand(command)
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('ValidationError')
      expect(result.error.message).toBe('Payload is required')
    }
  })

  test('should handle invalid payload type', async () => {
    const command = createMockCommand(
      'TestCommand',
      'test-aggregate',
      'test-id',
      'invalid' as unknown as TestCommandPayload
    )

    const validateCommand = (command: Command): Result<Command, AppError> => {
      if (typeof command.payload !== 'object') {
        return err({
          type: 'ValidationError',
          message: 'Payload must be an object',
          details: { field: 'payload' }
        })
      }
      return ok(command)
    }

    const result = validateCommand(command)
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('ValidationError')
      expect(result.error.message).toBe('Payload must be an object')
    }
  })
})
