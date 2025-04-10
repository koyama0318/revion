import { beforeEach, describe, expect, test } from 'bun:test'
import { type Result, err, ok } from 'neverthrow'
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
import { createCommandHandler } from '../../src/command/command-handler'
import {
  type AppError,
  createStoreOperationError,
  createValidationError
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
  eventType: TestEventType
  payload: TestEventPayload
}

describe('CommandHandler', () => {
  let aggregateId: AggregateId
  let aggregateType: AggregateType
  let eventHistory: TestEvent[]
  let snapshot: TestState | undefined

  beforeEach(() => {
    aggregateId = 'test-id' as AggregateId
    aggregateType = 'test-aggregate' as AggregateType
    eventHistory = []
    snapshot = undefined
  })

  test('should create new aggregate', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () => eventHistory,
      save: async events => {
        eventHistory.push(...events)
      },
      loadSnapshot: async () => undefined,
      saveSnapshot: async state => {
        snapshot = state
      }
    }

    const handler = createCommandHandler<TestState, Command, TestEventPayload>(
      (state, command) => {
        return ok([{ eventType: 'TestCreated', name: 'Test' }])
      },
      (state, event) => {
        const payload = event.payload
        if (payload.eventType === 'TestCreated') {
          return { ...state, name: payload.name || '' }
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

    const command = createMockCommand('create-test', aggregateType, aggregateId)

    const result = await handler(command)
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.newState.name).toBe('Test')
      expect(eventHistory.length).toBe(1)
      expect(eventHistory[0].payload.eventType).toBe('TestCreated')
    }
  })

  test('should handle validation errors', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () => eventHistory,
      save: async events => {
        eventHistory.push(...events)
      },
      loadSnapshot: async () => undefined,
      saveSnapshot: async state => {
        snapshot = state
      }
    }

    const handler = createCommandHandler<TestState, Command, TestEventPayload>(
      (state, command) => {
        return err({
          type: 'ValidationError',
          message: 'Invalid command',
          details: { field: 'name' }
        })
      },
      (state, event) => state,
      (type, id) => ({
        id,
        name: '',
        counter: 0,
        aggregateType: type,
        aggregateId: id
      }),
      eventStore
    )

    const command = createMockCommand('create-test', aggregateType, aggregateId)

    const result = await handler(command)
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('ValidationError')
      expect(result.error.message).toBe('Invalid command')
    }
  })

  test('should handle store operation errors', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () => {
        throw new Error('Failed to load history')
      },
      save: async events => {
        throw new Error('Failed to save events')
      },
      loadSnapshot: async () => undefined,
      saveSnapshot: async state => {
        throw new Error('Failed to save snapshot')
      }
    }

    const handler = createCommandHandler<TestState, Command, TestEventPayload>(
      (state, command) => {
        return ok([{ eventType: 'TestCreated', name: 'Test' }])
      },
      (state, event) => {
        const payload = event.payload
        if (payload.eventType === 'TestCreated') {
          return { ...state, name: payload.name || '' }
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

    const command = createMockCommand('create-test', aggregateType, aggregateId)

    const result = await handler(command)
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('StoreOperationError')
    }
  })

  test('should create new aggregate when not exists', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async (aggregateType: string, fromVersion?: number) => {
        const events: DomainEvent<TestEventPayload>[] = []
        return events
      },
      save: async (events: DomainEvent<TestEventPayload>[]) => {
        return
      },
      loadSnapshot: async (aggregateType: string) => {
        return undefined
      },
      saveSnapshot: async (snapshot: Snapshot<TestState>) => {
        return
      }
    }

    const handler = createCommandHandler<TestState, Command, TestEventPayload>(
      (
        state: TestState,
        command: Command
      ): Result<TestEventPayload[], AppError> => {
        const { name } = command.payload as { name: string }
        return ok([
          {
            eventType: 'TestCreated',
            name
          }
        ])
      },
      (state: TestState, event: DomainEvent<TestEventPayload>): TestState => {
        const payload = event.payload
        if (payload.eventType === 'TestCreated' && payload.name) {
          return {
            ...state,
            name: payload.name
          }
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
      { name: 'Test Aggregate' }
    )

    const result = await handler(command)
    expect(result.isOk()).toBe(true)
  })

  test('should load existing aggregate from history', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async (aggregateType: string, fromVersion?: number) => {
        const events: DomainEvent<TestEventPayload>[] = [
          {
            eventId: '1',
            eventType: 'TestCreated',
            aggregateType,
            aggregateId,
            version: 1,
            payload: {
              eventType: 'TestCreated',
              name: 'Test Aggregate'
            },
            timestamp: new Date()
          }
        ]
        return events
      },
      save: async (events: DomainEvent<TestEventPayload>[]) => {
        return
      },
      loadSnapshot: async (aggregateType: string) => {
        return undefined
      },
      saveSnapshot: async (snapshot: Snapshot<TestState>) => {
        return
      }
    }

    const handler = createCommandHandler<TestState, Command, TestEventPayload>(
      (
        state: TestState,
        command: Command
      ): Result<TestEventPayload[], AppError> => {
        return ok([
          {
            eventType: 'CounterIncremented'
          }
        ])
      },
      (state: TestState, event: DomainEvent<TestEventPayload>): TestState => {
        const payload = event.payload
        if (payload.eventType === 'CounterIncremented') {
          return {
            ...state,
            counter: state.counter + 1
          }
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
      'increment-counter',
      aggregateType,
      aggregateId,
      {}
    )

    const result = await handler(command)
    expect(result.isOk()).toBe(true)
  })

  test('should apply events to update state', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async (aggregateType: string, fromVersion?: number) => {
        const events: DomainEvent<TestEventPayload>[] = [
          {
            eventId: '1',
            eventType: 'TestCreated',
            aggregateType,
            aggregateId,
            version: 1,
            payload: {
              eventType: 'TestCreated',
              name: 'Test Aggregate'
            },
            timestamp: new Date()
          }
        ]
        return events
      },
      save: async (events: DomainEvent<TestEventPayload>[]) => {
        return
      },
      loadSnapshot: async (aggregateType: string) => {
        return undefined
      },
      saveSnapshot: async (snapshot: Snapshot<TestState>) => {
        return
      }
    }

    const handler = createCommandHandler<TestState, Command, TestEventPayload>(
      (state, command) => {
        return ok([
          {
            eventType: 'CounterIncremented'
          }
        ])
      },
      (state, event) => {
        const payload = event.payload
        if (payload.eventType === 'CounterIncremented') {
          return {
            ...state,
            counter: state.counter + 1
          }
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
      'increment-counter',
      aggregateType,
      aggregateId,
      {}
    )

    const result = await handler(command)
    expect(result.isOk()).toBe(true)
  })

  test('should handle event store errors', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async (aggregateType: string, fromVersion?: number) => {
        throw createStoreOperationError(
          'Failed to load history',
          'loadHistory',
          { details: { aggregateType, fromVersion } }
        )
      },
      save: async (events: DomainEvent<TestEventPayload>[]) => {
        return
      },
      loadSnapshot: async (aggregateType: string) => {
        return undefined
      },
      saveSnapshot: async (snapshot: Snapshot<TestState>) => {
        return
      }
    }

    const handler = createCommandHandler<TestState, Command, TestEventPayload>(
      (state, command) => {
        return ok([
          {
            eventType: 'TestCreated',
            name: 'Test Aggregate'
          }
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
      { name: 'Test Aggregate' }
    )
    const result = await handler(command)
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('StoreOperationError')
      expect(result.error.message).toBe('Failed to load history')
      expect(result.error.operation).toBe('loadHistory')
      expect(result.error.details).toEqual({ aggregateType, fromVersion: 0 })
    }
  })

  test('should create snapshots at correct intervals', async () => {
    let snapshotCount = 0
    let eventHistory: DomainEvent<TestEventPayload>[] = []
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async (aggregateType: string, fromVersion?: number) => {
        return eventHistory.filter(event => event.version > (fromVersion ?? 0))
      },
      save: async (events: DomainEvent<TestEventPayload>[]) => {
        eventHistory = [...eventHistory, ...events]
        return
      },
      loadSnapshot: async (aggregateType: string) => {
        return undefined
      },
      saveSnapshot: async (snapshot: Snapshot<TestState>) => {
        snapshotCount++
        return
      }
    }

    const handler = createCommandHandler<TestState, Command, TestEventPayload>(
      (state, command) => {
        return ok([
          {
            eventType: 'CounterIncremented'
          }
        ])
      },
      (state, event) => {
        const payload = event.payload
        if (payload.eventType === 'CounterIncremented') {
          return {
            ...state,
            counter: state.counter + 1
          }
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

    // スナップショット間隔未満のイベントを生成
    for (let i = 0; i < 99; i++) {
      const command = createMockCommand(
        'increment-counter',
        aggregateType,
        aggregateId,
        {}
      )
      await handler(command)
    }
    expect(snapshotCount).toBe(0)

    // スナップショット間隔に達したイベントを生成
    const command = createMockCommand(
      'increment-counter',
      aggregateType,
      aggregateId,
      {}
    )
    await handler(command)
    expect(snapshotCount).toBe(1)
  })
})
