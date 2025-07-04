import { describe, expect, it } from 'bun:test'
import { EventStoreInMemory, id, ok } from '../../../src'
import type { ExtendedState } from '../../../src'
import { createReplayEventFnFactory } from '../../../src/command/fn/replay-event'
import type { CounterState } from '../../data/command/counter'
import { counter } from '../../data/command/counter'

describe('replay event function', () => {
  it('should return ok when events are replayed', async () => {
    // Arrange
    const es = new EventStoreInMemory()
    const newId = id('counter', '00000000-0000-0000-0000-000000000001')
    es.events.push({
      aggregateId: newId,
      version: 1,
      event: { type: 'created' },
      timestamp: new Date()
    })
    es.events.push({
      aggregateId: newId,
      version: 2,
      event: { type: 'incremented' },
      timestamp: new Date()
    })
    const deps = { eventStore: es }
    const replayEventFn = createReplayEventFnFactory(counter.stateInit, counter.reducer)(deps)

    // Act
    const res = await replayEventFn(newId)

    // Assert
    const expected = ok({
      state: {
        id: id('counter', '00000000-0000-0000-0000-000000000001'),
        count: 1
      },
      version: 2
    } as ExtendedState<CounterState>)

    expect(res).toEqual(expected)
  })

  it('should return ok when events and snapshot are replayed', async () => {
    // Arrange
    const es = new EventStoreInMemory()
    const newId = id('counter', '00000000-0000-0000-0000-000000000001')
    es.events.push({
      aggregateId: newId,
      version: 1,
      event: { type: 'created' },
      timestamp: new Date()
    })
    es.events.push({
      aggregateId: newId,
      version: 2,
      event: { type: 'incremented' },
      timestamp: new Date()
    })
    es.events.push({
      aggregateId: newId,
      version: 3,
      event: { type: 'incremented' },
      timestamp: new Date()
    })
    es.snapshots.push({
      state: {
        id: newId,
        count: 1
      } as CounterState,
      version: 2,
      timestamp: new Date()
    })
    const deps = { eventStore: es }
    const replayEventFn = createReplayEventFnFactory(counter.stateInit, counter.reducer)(deps)

    // Act
    const res = await replayEventFn(newId)

    // Assert
    const expected = ok({
      state: {
        id: { type: 'counter' as const, id: '00000000-0000-0000-0000-000000000001' },
        count: 2
      },
      version: 3
    } as ExtendedState<CounterState>)

    expect(res).toEqual(expected)
  })

  it('should return ok if only snapshot was found', async () => {
    // Arrange
    const es = new EventStoreInMemory()
    const newId = id('counter', '00000000-0000-0000-0000-000000000001')
    es.snapshots.push({
      state: {
        id: newId,
        count: 10
      } as CounterState,
      version: 20,
      timestamp: new Date()
    })
    const deps = { eventStore: es }
    const replayEventFn = createReplayEventFnFactory(counter.stateInit, counter.reducer)(deps)

    // Act
    const res = await replayEventFn(newId)

    // Assert
    const expected = ok({
      state: {
        id: newId,
        count: 10
      },
      version: 20
    })

    expect(res).toEqual(expected)
  })

  it('should return error if no events were stored', async () => {
    // Arrange
    const es = new EventStoreInMemory()
    const deps = { eventStore: es }
    const replayEventFn = createReplayEventFnFactory(counter.stateInit, counter.reducer)(deps)

    // Act
    const res = await replayEventFn(id('counter', '00000000-0000-0000-0000-000000000001'))

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('NO_EVENTS_STORED')
    }
  })

  it('should return error when snapshot cannot be loaded', async () => {
    // Arrange
    const es = new EventStoreInMemory()
    es.getSnapshot = async _ => {
      throw new Error('test')
    }
    const deps = { eventStore: es }
    const replayEventFn = createReplayEventFnFactory(counter.stateInit, counter.reducer)(deps)

    // Act
    const res = await replayEventFn(id('counter', '00000000-0000-0000-0000-000000000001'))

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('SNAPSHOT_CANNOT_BE_LOADED')
    }
  })

  it('should return error when events cannot be loaded', async () => {
    // Arrange
    const es = new EventStoreInMemory()
    es.getEvents = async () => {
      throw new Error('test')
    }
    const deps = { eventStore: es }
    const replayEventFn = createReplayEventFnFactory(counter.stateInit, counter.reducer)(deps)

    // Act
    const res = await replayEventFn(id('counter', '00000000-0000-0000-0000-000000000001'))

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('EVENTS_CANNOT_BE_LOADED')
    }
  })
})
