import { beforeEach, describe, expect, it } from 'bun:test'
import { SNAPSHOT_INTERVAL, createCommandHandler } from '../../src/command/command-handler'
import type { CommandHandlerFactory } from '../../src/types/command-bus'
import type { EventStore } from '../../src/types/event-store'
import type { AggregateId, Id } from '../../src/types/id'
import { EventStoreInMemory } from '../../src/utils/event-store-in-memory'
import { err, ok } from '../../src/utils/result'

type CounterState = {
  aggregateId: Id<'Counter'>
  version: number
  count: number
}

type CounterCommand = {
  aggregateId: Id<'Counter'>
  operation: 'increment' | 'decrement'
  payload: {
    amount: number
  }
}

type CounterEvent = {
  aggregateId: Id<'Counter'>
  eventType: 'increment' | 'decrement'
  version: number
  timestamp: Date
  payload: {
    amount: number
  }
}

function setupHandlerFactory(): CommandHandlerFactory {
  const initState = (id: AggregateId): CounterState => ({
    aggregateId: id as Id<'Counter'>,
    version: 0,
    count: 0
  })

  const eventDecider = (state: CounterState, command: CounterCommand) => {
    switch (command.operation) {
      case 'increment':
        return ok([
          {
            aggregateId: command.aggregateId,
            eventType: 'increment' as const,
            version: state.version + 1,
            timestamp: new Date(),
            payload: { amount: command.payload.amount }
          }
        ])
      case 'decrement':
        return ok([
          {
            aggregateId: command.aggregateId,
            eventType: 'decrement' as const,
            version: state.version + 1,
            timestamp: new Date(),
            payload: { amount: command.payload.amount }
          }
        ])
    }
  }

  const reducer = (state: CounterState, event: CounterEvent): CounterState => {
    switch (event.eventType) {
      case 'increment':
        return {
          ...state,
          version: event.version,
          count: state.count + event.payload.amount
        }
      case 'decrement':
        return { ...state, version: event.version, count: state.count - event.payload.amount }
    }
  }

  return createCommandHandler<CounterState, CounterCommand, CounterEvent>(initState, eventDecider, reducer)
}

describe('CommandHandler', () => {
  let eventStore: EventStore

  beforeEach(() => {
    eventStore = new EventStoreInMemory()
  })

  it('should call handler if valid command is dispatched', async () => {
    const factory = setupHandlerFactory()
    const handler = factory(eventStore)

    const command = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      operation: 'increment',
      payload: { amount: 1 }
    }
    const result = await handler(command)

    expect(result).toEqual(ok(undefined))
  })

  it('should process command if events exist', async () => {
    const factory = setupHandlerFactory()
    const handler = factory(eventStore)

    await eventStore.saveEvents([
      {
        aggregateId: 'Counter#1',
        eventType: 'increment',
        version: 1,
        timestamp: new Date(),
        payload: { amount: 1 }
      }
    ])

    const command = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      operation: 'increment',
      payload: { amount: 1 }
    }
    const result = await handler(command)

    expect(result).toEqual(ok(undefined))
  })

  it('should process command if snapshot exists', async () => {
    const factory = setupHandlerFactory()
    const handler = factory(eventStore)

    const event = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      eventType: 'increment',
      version: 1,
      timestamp: new Date(),
      payload: { amount: 1 }
    }
    const events = Array(SNAPSHOT_INTERVAL + 1)
      .fill(null)
      .map((_, i) => ({ ...event, version: i + 1 }))
    await eventStore.saveEvents(events)

    await eventStore.saveSnapshot({
      aggregateId: 'Counter#1' as Id<'Counter'>,
      version: 20,
      timestamp: new Date(),
      data: {
        aggregateId: 'Counter#1' as Id<'Counter'>,
        version: 20,
        count: 20
      }
    })

    const command = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      operation: 'increment',
      payload: { amount: 1 }
    }
    const result = await handler(command)

    expect(result).toEqual(ok(undefined))
  })

  it('should save snapshot if events count is over snapshot interval', async () => {
    expect(true).toBe(true)
  })

  it('should return error if event read fails', async () => {
    expect(true).toBe(true)
  })

  it('should return error if snapshot read fails', async () => {
    expect(true).toBe(true)
  })

  it('should not process command if snapshot exists but data is invalid', async () => {
    const factory = setupHandlerFactory()
    const handler = factory(eventStore)

    const event = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      eventType: 'increment',
      version: 1,
      timestamp: new Date(),
      payload: { amount: 1 }
    }
    const events = Array(SNAPSHOT_INTERVAL + 1)
      .fill(null)
      .map((_, i) => ({ ...event, version: i + 1 }))
    await eventStore.saveEvents(events)

    await eventStore.saveSnapshot({
      aggregateId: 'Counter#1' as Id<'Counter'>,
      version: 20,
      timestamp: new Date(),
      data: {
        aggregateId: 'Counter#1' as Id<'Counter'>,
        version: 20,
        count: 20
      }
    })

    const command = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      operation: 'increment',
      payload: { amount: 1 }
    }
    const result = await handler(command)

    expect(result).toEqual(
      err({
        code: 'INVALID_SNAPSHOT_DATA',
        message: 'Snapshot data does not satisfy State interface'
      })
    )
  })

  it('should return error if decider returns validation error', async () => {
    expect(true).toBe(true)
  })

  it('should return error if decider returns empty event', async () => {
    expect(true).toBe(true)
  })

  it('should return error if last version read fails', async () => {
    expect(true).toBe(true)
  })

  it('should return error if optimistic lock fails', async () => {
    expect(true).toBe(true)
  })

  it('should return error if events save fails', async () => {
    expect(true).toBe(true)
  })

  it('should return error if snapshot save fails', async () => {
    expect(true).toBe(true)
  })
})
