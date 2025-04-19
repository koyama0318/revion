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
  operation: 'increment' | 'decrement' | 'noEvent'
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
      case 'noEvent':
        return ok([])
      default:
        return err({
          code: 'INVALID_EVENT_DECISION',
          message: 'Invalid event decision'
        })
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
        return {
          ...state,
          version: event.version,
          count: state.count - event.payload.amount
        }
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
    const factory = setupHandlerFactory()
    const handler = factory(eventStore)

    const event = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      eventType: 'increment',
      version: 1,
      timestamp: new Date(),
      payload: { amount: 1 }
    }
    const events = Array(SNAPSHOT_INTERVAL - 1)
      .fill(null)
      .map((_, i) => ({ ...event, version: i + 1 }))
    await eventStore.saveEvents(events)

    const command = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      operation: 'increment',
      payload: { amount: 1 }
    }
    const result = await handler(command)

    expect(result).toEqual(ok(undefined))
  })

  it('should return error if event read fails', async () => {
    const factory = setupHandlerFactory()
    const handler = factory(eventStore)

    const event = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      eventType: 'increment',
      version: 1,
      timestamp: new Date(),
      payload: { amount: 1 }
    }
    const events = Array(SNAPSHOT_INTERVAL - 1)
      .fill(null)
      .map((_, i) => ({ ...event, version: i + 1 }))
    await eventStore.saveEvents(events)

    const command = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      operation: 'increment',
      payload: { amount: 1 }
    }
    const result = await handler(command)

    expect(result).toEqual(ok(undefined))
  })

  it('should return error if snapshot read fails', async () => {
    const es = new EventStoreInMemory()
    es.getSnapshot = async () => {
      return err(new Error('error'))
    }

    const factory = setupHandlerFactory()
    const handler = factory(es)

    const command = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      operation: 'increment',
      payload: { amount: 1 }
    }
    const result = await handler(command)

    expect(result).toEqual(
      err({
        code: 'SNAPSHOT_CANNOT_BE_LOADED',
        message: 'Snapshot cannot be loaded',
        cause: new Error('error')
      })
    )
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
    const factory = setupHandlerFactory()
    const handler = factory(eventStore)

    const command = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      operation: 'invalid_operation',
      payload: { amount: 1 }
    }
    const result = await handler(command)

    expect(result).toEqual(
      err({
        code: 'INVALID_EVENT_DECISION',
        message: 'Invalid event decision'
      })
    )
  })

  it('should return error if decider returns empty event', async () => {
    const factory = setupHandlerFactory()
    const handler = factory(eventStore)

    const command = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      operation: 'noEvent',
      payload: { amount: 1 }
    }
    const result = await handler(command)

    expect(result).toEqual(
      err({
        code: 'NO_EVENTS_GENERATED',
        message: 'No events generated'
      })
    )
  })

  it('should return error if last version read fails', async () => {
    const es = new EventStoreInMemory()
    es.getLastEventVersion = async () => {
      return err(new Error('error'))
    }

    const factory = setupHandlerFactory()
    const handler = factory(es)

    const command = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      operation: 'increment',
      payload: { amount: 1 }
    }
    const result = await handler(command)

    expect(result).toEqual(
      err({
        code: 'LAST_EVENT_VERSION_CANNOT_BE_LOADED',
        message: 'Last event version cannot be loaded',
        cause: new Error('error')
      })
    )
  })

  it('should return error if optimistic lock fails', async () => {
    const es = new EventStoreInMemory()
    es.getLastEventVersion = async () => {
      return ok(1)
    }

    const factory = setupHandlerFactory()
    const handler = factory(es)

    const command = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      operation: 'increment',
      payload: { amount: 1 }
    }
    const result = await handler(command)

    expect(result).toEqual(
      err({
        code: 'CONFLICT',
        message: 'Event version mismatch: 1, 2'
      })
    )
  })

  it('should return error if events save fails', async () => {
    const es = new EventStoreInMemory()
    es.saveEvents = async () => {
      return err(new Error('error'))
    }

    const factory = setupHandlerFactory()
    const handler = factory(es)

    const command = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      operation: 'increment',
      payload: { amount: 1 }
    }
    const result = await handler(command)

    expect(result).toEqual(
      err({
        code: 'EVENTS_CANNOT_BE_SAVED',
        message: 'Events cannot be saved',
        cause: new Error('error')
      })
    )
  })

  it('should return error if snapshot save fails', async () => {
    const es = new EventStoreInMemory()
    es.saveSnapshot = async () => {
      return err(new Error('error'))
    }

    const factory = setupHandlerFactory()
    const handler = factory(es)

    const event = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      eventType: 'increment',
      version: 1,
      timestamp: new Date(),
      payload: { amount: 1 }
    }
    const events = Array(SNAPSHOT_INTERVAL - 1)
      .fill(null)
      .map((_, i) => ({ ...event, version: i + 1 }))
    await es.saveEvents(events)

    const command = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      operation: 'increment',
      payload: { amount: 1 }
    }
    const result = await handler(command)

    expect(result).toEqual(
      err({
        code: 'SNAPSHOT_CANNOT_BE_SAVED',
        message: 'Snapshot cannot be saved',
        cause: new Error('error')
      })
    )
  })
})
