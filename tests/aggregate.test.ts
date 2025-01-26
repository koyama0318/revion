import { beforeEach, describe, expect, it } from 'bun:test'
import { AggregateId } from '../src/aggregateId'
import type { State } from '../src/types/aggregate'
import { counter } from './mock/counter'

interface ExtendedState extends State {
  value: number
}

describe('aggregate test', () => {
  beforeEach(() => {
    counter.reset()
  })

  it('should process a command', () => {
    const command = {
      type: 'create',
      id: new AggregateId('counter'),
      payload: {}
    }
    const aggregate = counter.processCommand(command)

    expect(aggregate.state as ExtendedState).toEqual({
      type: 'updated',
      value: 0,
      version: 1
    })
    expect(aggregate.events).toEqual([
      {
        type: 'created',
        id: { type: 'counter', id: expect.any(String) },
        payload: { value: 0 },
        version: 1,
        timestamp: expect.anything()
      }
    ])
    expect(aggregate.uncommittedEvents).toEqual([
      {
        type: 'created',
        id: { type: 'counter', id: expect.any(String) },
        payload: { value: 0 },
        version: 1,
        timestamp: expect.anything()
      }
    ])
  })

  it('should apply event', () => {
    const event = {
      type: 'created',
      id: { type: 'counter', id: '123' },
      payload: { value: 0 },
      version: 1,
      timestamp: new Date()
    }
    const aggregate = counter.applyEvent(event)

    expect(aggregate.events).toHaveLength(1)
    expect(aggregate.events).toEqual([event])
    expect(aggregate.uncommittedEvents).toHaveLength(0)
    expect(aggregate.state as ExtendedState).toEqual({
      type: 'updated',
      value: 0,
      version: 1
    })
  })

  it('should apply events', () => {
    const events = [
      {
        type: 'created',
        id: { type: 'counter', id: '123' },
        payload: { value: 0 },
        version: 1,
        timestamp: new Date()
      },
      {
        type: 'added',
        id: { type: 'counter', id: '123' },
        payload: { value: 1 },
        version: 2,
        timestamp: new Date()
      }
    ]
    const aggregate = counter.applyEvents(events)

    expect(aggregate.events).toHaveLength(2)
    expect(aggregate.events).toEqual(events)
    expect(aggregate.uncommittedEvents).toHaveLength(0)
    expect(aggregate.state as ExtendedState).toEqual({
      type: 'updated',
      value: 1,
      version: 2
    })
  })

  it('should commit events', () => {
    const events = [
      {
        type: 'created',
        id: { type: 'counter', id: '123' },
        payload: { value: 0 },
        version: 1,
        timestamp: new Date()
      },
      {
        type: 'added',
        id: { type: 'counter', id: '123' },
        payload: { value: 1, isMax: false },
        version: 2,
        timestamp: new Date()
      }
    ]
    const command = {
      type: 'increment',
      id: { type: 'counter', id: '123' },
      payload: {}
    }
    const expectedEvent = {
      type: 'added',
      id: { type: 'counter', id: '123' },
      payload: { value: 1, isMax: false },
      version: 3,
      timestamp: expect.any(Date)
    }

    // replay
    counter.applyEvents(events)

    expect(counter.events).toEqual(events)
    expect(counter.uncommittedEvents).toEqual([])
    expect(counter.state as ExtendedState).toEqual({
      type: 'updated',
      value: 1,
      version: 2
    })

    // process command
    counter.processCommand(command)

    expect(counter.events).toEqual([...events, expectedEvent])
    expect(counter.uncommittedEvents).toEqual([expectedEvent])
    expect(counter.state as ExtendedState).toEqual({
      type: 'updated',
      value: 2,
      version: 3
    })

    // commit
    counter.commitEvents()

    expect(counter.events).toEqual([...events, expectedEvent])
    expect(counter.uncommittedEvents).toEqual([])
    expect(counter.state as ExtendedState).toEqual({
      type: 'updated',
      value: 2,
      version: 3
    })
  })
})
