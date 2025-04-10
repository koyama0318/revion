import { beforeEach, describe, expect, test } from 'bun:test'
import { type Result, err, ok } from 'neverthrow'
import type {
  AggregateId,
  AggregateType,
  Command,
  CommandResultAsync
} from '../../src'
import { createCommandHandler } from '../../src/command/command-handler'
import type { AppError } from '../../src/types/app-error'
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

describe('Event Processing', () => {
  let aggregateId: AggregateId
  let aggregateType: AggregateType
  let eventHistory: TestEvent[]
  let snapshot: Snapshot<TestState> | undefined

  beforeEach(() => {
    aggregateId = 'test-id' as AggregateId
    aggregateType = 'test-aggregate' as AggregateType
    eventHistory = []
    snapshot = undefined
  })

  test('should process events in order', async () => {
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
        return ok([
          { eventType: 'TestCreated', name: 'Test1' },
          { eventType: 'TestCreated', name: 'Test2' }
        ])
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
      const typedResult = result as CommandResultAsync<
        TestState,
        TestEventPayload
      >
      expect(typedResult.value.newState.name).toBe('Test2')
      expect(eventHistory.length).toBe(2)
      expect(eventHistory[0].payload.name).toBe('Test1')
      expect(eventHistory[1].payload.name).toBe('Test2')
    }
  })

  test('should handle event processing errors', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () => ok(eventHistory),
      save: async (_, __, events) => {
        return err({
          type: 'StoreOperationError',
          message: 'Failed to save events',
          operation: 'saveEvents',
          details: { error: new Error('Failed to save events') }
        })
      },
      loadSnapshot: async () => ok(snapshot),
      saveSnapshot: async (_, __, newSnapshot) => {
        snapshot = newSnapshot
        return ok(undefined)
      }
    }

    const handler = createCommandHandler<TestState, Command, TestEventPayload>(
      (state, command) => {
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

  test('should maintain event order after errors', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () => ok(eventHistory),
      save: async (_, __, events) => {
        if (eventHistory.length > 0) {
          return err({
            type: 'StoreOperationError',
            message: 'Failed to save events',
            operation: 'saveEvents',
            details: { error: new Error('Failed to save events') }
          })
        }
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
        return ok([
          { eventType: 'TestCreated', name: 'Test1' },
          { eventType: 'TestCreated', name: 'Test2' }
        ])
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
    expect(eventHistory.length).toBe(0)
  })

  test('should handle concurrent event processing', async () => {
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

    const command1 = createMockCommand(
      'create-test',
      aggregateType,
      aggregateId,
      { name: 'Test1' } as TestCommandPayload
    )

    const command2 = createMockCommand(
      'create-test',
      aggregateType,
      aggregateId,
      { name: 'Test2' } as TestCommandPayload
    )

    const [result1, result2] = await Promise.all([
      handler(command1),
      handler(command2)
    ])

    expect(result1.isOk()).toBe(true)
    expect(result2.isOk()).toBe(true)
    expect(eventHistory.length).toBe(2)
  })
})
