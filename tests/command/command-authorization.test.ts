import { beforeEach, describe, expect, test } from 'bun:test'
import { type Result, err, ok } from 'neverthrow'
import type {
  AggregateId,
  AggregateType,
  Command,
  CommandResultAsync
} from '../../src'
import { createCommandHandler } from '../../src/command/command-handler'
import type {
  AppError,
  PermissionDeniedError,
  StoreOperationError
} from '../../src/types/app-error'
import type { State } from '../../src/types/command-aggregate'
import type {
  DomainEvent,
  DomainEventPayload
} from '../../src/types/domain-event'
import type { EventStore } from '../../src/types/event-store'
import type { Snapshot } from '../../src/types/snapshot'
import { createMockCommand } from '../setup'

interface TestState extends State {
  id: string
  name: string
  counter: number
  aggregateType: AggregateType
  aggregateId: AggregateId
}

type TestEventType = 'TestCreated' | 'CounterIncremented'

interface TestEventPayload extends DomainEventPayload {
  readonly eventType: TestEventType
  readonly name?: string
}

interface TestEvent extends DomainEvent<TestEventPayload> {
  eventId: string
  eventType: TestEventType
  aggregateType: AggregateType
  aggregateId: AggregateId
  version: number
  timestamp: Date
  payload: TestEventPayload
}

interface TestCommandPayload {
  name?: string
}

interface User {
  id: string
  roles: string[]
}

describe('Command Authorization', () => {
  let aggregateId: AggregateId
  let aggregateType: AggregateType
  let eventHistory: TestEvent[]
  let currentUser: User | undefined
  let snapshot: Snapshot<TestState> | undefined

  beforeEach(() => {
    aggregateId = 'test-id' as AggregateId
    aggregateType = 'test-aggregate' as AggregateType
    eventHistory = []
    currentUser = undefined
    snapshot = undefined
  })

  test('should authorize valid commands', async () => {
    currentUser = {
      id: 'user-1',
      roles: ['admin']
    }

    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () => ok(eventHistory),
      save: async (_, __, events) => {
        eventHistory.push(...(events as TestEvent[]))
        return ok(undefined)
      },
      loadSnapshot: async () => ok(snapshot),
      saveSnapshot: async (_, __, newSnapshot) => {
        snapshot = newSnapshot
        return ok(undefined)
      }
    }

    const handler = createCommandHandler<TestState, Command, TestEventPayload>(
      (state, command) => {
        if (command.operation !== 'create-test') {
          return err({
            type: 'PermissionDeniedError',
            message: 'Unauthorized operation',
            details: { operation: command.operation }
          } as PermissionDeniedError)
        }
        return ok([{ eventType: 'TestCreated', name: 'Test' }])
      },
      (state, event) => {
        const payload = event.payload
        if (payload.eventType === 'TestCreated' && payload.name) {
          return { ...state, name: payload.name }
        }
        return state
      },
      (type, id) => ({
        id,
        name: '',
        counter: 0,
        aggregateType: type,
        aggregateId: id
      }),
      eventStore
    )

    const command = createMockCommand(
      'create-test',
      aggregateType,
      aggregateId,
      { name: 'Test' } as TestCommandPayload
    )

    const result = await handler(command)
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(eventHistory.length).toBe(1)
      expect(eventHistory[0].payload.name).toBe('Test')
    }
  })

  test('should reject unauthorized commands', async () => {
    currentUser = {
      id: 'user-1',
      roles: ['user']
    }

    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () => ok(eventHistory),
      save: async (_, __, events) => {
        eventHistory.push(...(events as TestEvent[]))
        return ok(undefined)
      },
      loadSnapshot: async () => ok(snapshot),
      saveSnapshot: async (_, __, newSnapshot) => {
        snapshot = newSnapshot
        return ok(undefined)
      }
    }

    const handler = createCommandHandler<TestState, Command, TestEventPayload>(
      (state, command) => {
        if (command.operation !== 'create-test') {
          return err({
            type: 'PermissionDeniedError',
            message: 'Unauthorized operation',
            details: { operation: command.operation }
          } as PermissionDeniedError)
        }
        return ok([{ eventType: 'TestCreated', name: 'Test' }])
      },
      (state, event) => {
        const payload = event.payload
        if (payload.eventType === 'TestCreated' && payload.name) {
          return { ...state, name: payload.name }
        }
        return state
      },
      (type, id) => ({
        id,
        name: '',
        counter: 0,
        aggregateType: type,
        aggregateId: id
      }),
      eventStore
    )

    const command = createMockCommand(
      'invalid-operation',
      aggregateType,
      aggregateId,
      { name: 'Test' } as TestCommandPayload
    )

    const result = await handler(command)
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('PermissionDeniedError')
      expect(result.error.message).toBe('Unauthorized operation')
    }
  })

  test('should handle authorization errors', async () => {
    currentUser = {
      id: 'user-1',
      roles: ['admin']
    }

    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () => ok(eventHistory),
      save: async (_, __, events) => {
        return err({
          type: 'StoreOperationError',
          message: 'Failed to save events',
          operation: 'saveEvents',
          details: { error: new Error('Failed to save events') }
        } as StoreOperationError)
      },
      loadSnapshot: async () => ok(snapshot),
      saveSnapshot: async (_, __, newSnapshot) => {
        snapshot = newSnapshot
        return ok(undefined)
      }
    }

    const handler = createCommandHandler<TestState, Command, TestEventPayload>(
      (state, command) => {
        if (command.operation !== 'create-test') {
          return err({
            type: 'PermissionDeniedError',
            message: 'Unauthorized operation',
            details: { operation: command.operation }
          } as PermissionDeniedError)
        }
        return ok([{ eventType: 'TestCreated', name: 'Test' }])
      },
      (state, event) => {
        const payload = event.payload
        if (payload.eventType === 'TestCreated' && payload.name) {
          return { ...state, name: payload.name }
        }
        return state
      },
      (type, id) => ({
        id,
        name: '',
        counter: 0,
        aggregateType: type,
        aggregateId: id
      }),
      eventStore
    )

    const command = createMockCommand(
      'create-test',
      aggregateType,
      aggregateId,
      { name: 'Test' } as TestCommandPayload
    )

    const result = await handler(command)
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('StoreOperationError')
      expect(result.error.message).toBe('Failed to save events')
    }
  })
})
