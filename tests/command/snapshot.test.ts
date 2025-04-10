import { beforeEach, describe, expect, test } from 'bun:test'
import { type Result, err, ok } from 'neverthrow'
import type {
  AggregateId,
  AggregateType,
  Command,
  CommandResultAsync
} from '../../src'
import { createCommandHandler } from '../../src/command/command-handler'
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

describe('Snapshot', () => {
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

  test('should load state from snapshot', async () => {
    const initialState: TestState = {
      id: aggregateId,
      name: 'Initial',
      counter: 5,
      aggregateType,
      aggregateId
    }

    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () => eventHistory,
      save: async events => {
        eventHistory.push(...events)
      },
      loadSnapshot: async () => initialState,
      saveSnapshot: async state => {
        snapshot = state
      }
    }

    const handler = createCommandHandler<TestState, Command, TestEventPayload>(
      (state, command) => {
        return ok([{ eventType: 'CounterIncremented' }])
      },
      (state, event) => {
        const payload = event.payload
        if (payload.eventType === 'CounterIncremented') {
          return { ...state, counter: state.counter + 1 }
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
      aggregateId
    )

    const result = await handler(command)
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.newState.counter).toBe(6)
      expect(eventHistory.length).toBe(1)
      expect(snapshot?.counter).toBe(6)
    }
  })

  test('should create snapshot after threshold', async () => {
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
        return ok([{ eventType: 'CounterIncremented' }])
      },
      (state, event) => {
        const payload = event.payload
        if (payload.eventType === 'CounterIncremented') {
          return { ...state, counter: state.counter + 1 }
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
      eventStore,
      3 // スナップショットの閾値を3に設定
    )

    const commands = Array.from({ length: 5 }, (_, i) =>
      createMockCommand('increment-counter', aggregateType, aggregateId, {
        index: i
      })
    )

    for (const command of commands) {
      await handler(command)
    }

    expect(eventHistory.length).toBe(5)
    expect(snapshot?.counter).toBe(5)
  })

  test('should handle snapshot loading errors', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () => eventHistory,
      save: async events => {
        eventHistory.push(...events)
      },
      loadSnapshot: async () => {
        throw new Error('Failed to load snapshot')
      },
      saveSnapshot: async state => {
        snapshot = state
      }
    }

    const handler = createCommandHandler<TestState, Command, TestEventPayload>(
      (state, command) => {
        return ok([{ eventType: 'CounterIncremented' }])
      },
      (state, event) => {
        const payload = event.payload
        if (payload.eventType === 'CounterIncremented') {
          return { ...state, counter: state.counter + 1 }
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
      aggregateId
    )

    const result = await handler(command)
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.newState.counter).toBe(1)
      expect(eventHistory.length).toBe(1)
    }
  })

  test('should handle snapshot saving errors', async () => {
    const eventStore: EventStore<TestState, TestEventPayload> = {
      loadHistory: async () => eventHistory,
      save: async events => {
        eventHistory.push(...events)
      },
      loadSnapshot: async () => undefined,
      saveSnapshot: async () => {
        throw new Error('Failed to save snapshot')
      }
    }

    const handler = createCommandHandler<TestState, Command, TestEventPayload>(
      (state, command) => {
        return ok([{ eventType: 'CounterIncremented' }])
      },
      (state, event) => {
        const payload = event.payload
        if (payload.eventType === 'CounterIncremented') {
          return { ...state, counter: state.counter + 1 }
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
      aggregateId
    )

    const result = await handler(command)
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.newState.counter).toBe(1)
      expect(eventHistory.length).toBe(1)
    }
  })
})
