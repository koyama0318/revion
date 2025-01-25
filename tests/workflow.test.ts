import { describe, it, beforeEach, afterEach, expect } from 'bun:test'
import type { Aggregate } from '../src/types/aggregate'
import { CommandWorkflow } from '../src/workflow'
import { counter } from './mock/counter'
import { EventStoreInMemory } from './mock/eventStoreInMemory'

describe('workflow test', () => {
  const store = new EventStoreInMemory()
  let workflow: CommandWorkflow
  let aggregate: Aggregate

  beforeEach(() => {
    workflow = new CommandWorkflow(store)
    aggregate = counter.reset()
  })

  afterEach(() => {
    store.events = []
  })

  it('should execute a command', () => {
    const command = {
      type: 'create',
      id: { type: 'counter', id: '123' },
      payload: {}
    }
    workflow.execute(aggregate, command)

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

  it('should execute a command and process events', () => {
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
    workflow.execute(aggregate, command)

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
})
