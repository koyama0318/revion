import { describe, it, beforeEach, expect } from 'bun:test'
import { Handler } from '../src/handler'
import { counter } from './mock/counter'
import { EventStoreInMemory } from './mock/eventStoreInMemory'

describe('Handler', () => {
  let store: EventStoreInMemory
  let handler: Handler

  beforeEach(() => {
    store = new EventStoreInMemory()
    handler = new Handler(store)
    handler.register([counter.reset()])
  })

  it('should dispatch a command and process events on empty store', () => {
    const command = {
      type: 'create',
      id: { type: 'counter', id: '123' },
      payload: {}
    }
    handler.dispatch(command)

    expect(store.events).toEqual([
      {
        type: 'created',
        id: { type: 'counter', id: '123' },
        payload: { value: 0 },
        version: 1,
        timestamp: expect.anything()
      }
    ])
  })

  it('should dispatch a command and process events on non empty store', () => {
    store.events = [
      {
        type: 'created',
        id: { type: 'counter', id: '123' },
        payload: { value: 0 },
        version: 1,
        timestamp: expect.anything()
      }
    ]

    const command = {
      type: 'increment',
      id: { type: 'counter', id: '123' },
      payload: {}
    }
    handler.dispatch(command)

    expect(store.events).toEqual([
      {
        type: 'created',
        id: { type: 'counter', id: '123' },
        payload: { value: 0 },
        version: 1,
        timestamp: expect.anything()
      },
      {
        type: 'added',
        id: { type: 'counter', id: '123' },
        payload: { value: 1 },
        version: 2,
        timestamp: expect.anything()
      }
    ])
  })

  it('should throw an error if the aggregate is not found', () => {
    const command = {
      type: 'create',
      id: { type: 'unknown', id: '123' },
      payload: {}
    }
    expect(() => handler.dispatch(command)).toThrow(
      'Aggregate for type unknown not found'
    )
  })
})
