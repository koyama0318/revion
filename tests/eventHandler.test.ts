import { beforeEach, describe, expect, it } from 'bun:test'
import { CommandHandler } from '../src/handler'
import { EventStoreInMemory } from '../src/utils/fake/storeInMemory'
import { counter } from './mock/counter'

describe('handler test', () => {
  let store: EventStoreInMemory
  let handler: CommandHandler

  beforeEach(() => {
    store = new EventStoreInMemory([])
    handler = new CommandHandler(store, [counter.reset()])
  })

  it('should dispatch a command and process events on empty store', async () => {
    const command = {
      type: 'create',
      id: { type: 'counter', id: '123' },
      payload: {}
    }
    await handler.handle(command)

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

  it('should dispatch a command and process events on non empty store', async () => {
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
    await handler.handle(command)

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
        payload: { value: 1, isMax: false },
        version: 2,
        timestamp: expect.anything()
      }
    ])
  })

  it('should throw an error if the aggregate is not found', async () => {
    const command = {
      type: 'create',
      id: { type: 'unknown', id: '123' },
      payload: {}
    }
    await expect(handler.handle(command)).rejects.toThrow(
      'Aggregate for type unknown not found'
    )
  })
})
