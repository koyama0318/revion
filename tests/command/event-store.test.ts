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

describe('EventStore', () => {
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

  test('should load history', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () => ok(eventHistory),
      save: async (_, __, events) => {
        eventHistory.push(...(events as TestEvent[]))
        return ok(undefined)
      },
      loadSnapshot: async () => ok(undefined),
      saveSnapshot: async (_, __, snapshotData) => {
        snapshot = snapshotData
        return ok(undefined)
      }
    }

    const result = await eventStore.loadHistory(aggregateType, aggregateId)
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toEqual([])
    }
  })

  test('should save events', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () => ok(eventHistory),
      save: async (_, __, events) => {
        eventHistory.push(...(events as TestEvent[]))
        return ok(undefined)
      },
      loadSnapshot: async () => ok(undefined),
      saveSnapshot: async (_, __, snapshotData) => {
        snapshot = snapshotData
        return ok(undefined)
      }
    }

    const events: TestEvent[] = [
      {
        eventId: 'event-1',
        eventType: 'TestCreated',
        aggregateType,
        aggregateId,
        version: 1,
        timestamp: new Date(),
        payload: { eventType: 'TestCreated', name: 'Test' }
      }
    ]

    const result = await eventStore.save(aggregateType, aggregateId, events)
    expect(result.isOk()).toBe(true)
    expect(eventHistory.length).toBe(1)
    expect(eventHistory[0].payload.eventType).toBe('TestCreated')
  })

  test('should load snapshot', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () => ok(eventHistory),
      save: async (_, __, events) => {
        eventHistory.push(...(events as TestEvent[]))
        return ok(undefined)
      },
      loadSnapshot: async () => ok(undefined),
      saveSnapshot: async (_, __, snapshotData) => {
        snapshot = snapshotData
        return ok(undefined)
      }
    }

    const result = await eventStore.loadSnapshot(aggregateType, aggregateId)
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBeUndefined()
    }
  })

  test('should save snapshot', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () => ok(eventHistory),
      save: async (_, __, events) => {
        eventHistory.push(...(events as TestEvent[]))
        return ok(undefined)
      },
      loadSnapshot: async () => ok(undefined),
      saveSnapshot: async (_, __, snapshotData) => {
        snapshot = snapshotData
        return ok(undefined)
      }
    }

    const state: TestState = {
      id: aggregateId,
      name: 'Test',
      counter: 0,
      aggregateType,
      aggregateId
    }

    const snapshotData: Snapshot<TestState> = {
      state,
      version: 1,
      timestamp: new Date(),
      aggregateId,
      aggregateType
    }

    const result = await eventStore.saveSnapshot(
      aggregateType,
      aggregateId,
      snapshotData
    )
    expect(result.isOk()).toBe(true)
    expect(snapshot?.state).toEqual(state)
  })

  test('should handle load history error', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () =>
        err({
          type: 'StoreOperationError',
          message: 'Failed to load history',
          operation: 'loadHistory',
          details: { error: new Error('Failed to load history') }
        }),
      save: async (_, __, events) => {
        eventHistory.push(...(events as TestEvent[]))
        return ok(undefined)
      },
      loadSnapshot: async () => ok(undefined),
      saveSnapshot: async (_, __, snapshotData) => {
        snapshot = snapshotData
        return ok(undefined)
      }
    }

    const result = await eventStore.loadHistory(aggregateType, aggregateId)
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('StoreOperationError')
    }
  })

  test('should handle save events error', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () => ok(eventHistory),
      save: async () =>
        err({
          type: 'StoreOperationError',
          message: 'Failed to save events',
          operation: 'saveEvents',
          details: { error: new Error('Failed to save events') }
        }),
      loadSnapshot: async () => ok(undefined),
      saveSnapshot: async (_, __, snapshotData) => {
        snapshot = snapshotData
        return ok(undefined)
      }
    }

    const events: TestEvent[] = [
      {
        eventId: 'event-1',
        eventType: 'TestCreated',
        aggregateType,
        aggregateId,
        version: 1,
        timestamp: new Date(),
        payload: { eventType: 'TestCreated', name: 'Test' }
      }
    ]

    const result = await eventStore.save(aggregateType, aggregateId, events)
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('StoreOperationError')
    }
  })

  test('should handle load snapshot error', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () => ok(eventHistory),
      save: async (_, __, events) => {
        eventHistory.push(...(events as TestEvent[]))
        return ok(undefined)
      },
      loadSnapshot: async () =>
        err({
          type: 'StoreOperationError',
          message: 'Failed to load snapshot',
          operation: 'loadSnapshot',
          details: { error: new Error('Failed to load snapshot') }
        }),
      saveSnapshot: async (_, __, snapshotData) => {
        snapshot = snapshotData
        return ok(undefined)
      }
    }

    const result = await eventStore.loadSnapshot(aggregateType, aggregateId)
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('StoreOperationError')
    }
  })

  test('should handle save snapshot error', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () => ok(eventHistory),
      save: async (_, __, events) => {
        eventHistory.push(...(events as TestEvent[]))
        return ok(undefined)
      },
      loadSnapshot: async () => ok(undefined),
      saveSnapshot: async () =>
        err({
          type: 'StoreOperationError',
          message: 'Failed to save snapshot',
          operation: 'saveSnapshot',
          details: { error: new Error('Failed to save snapshot') }
        })
    }

    const state: TestState = {
      id: aggregateId,
      name: 'Test',
      counter: 0,
      aggregateType,
      aggregateId
    }

    const snapshotData: Snapshot<TestState> = {
      state,
      version: 1,
      timestamp: new Date(),
      aggregateId,
      aggregateType
    }

    const result = await eventStore.saveSnapshot(
      aggregateType,
      aggregateId,
      snapshotData
    )
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('StoreOperationError')
    }
  })
})
