import { describe, expect, test } from 'bun:test'
import type { EventUnitTestCase, UnitTestCase } from '../../src/types/testCase'
import { aggregateTest, eventListenerTest } from '../../src/utils/test/unitTest'
import type { CounterCommand, CounterEvent, CounterState } from './counter'
import { counter, counterListener } from './counter'
import type { UserCounterReadModel } from './userCounter'
import type { ReadModelRecord } from '../../src/utils/fake/storeInMemory'

const cases: UnitTestCase<CounterCommand, CounterState, CounterEvent>[] = [
  {
    command: {
      operation: 'create',
      id: { type: 'counter', id: '123' }
    },
    event: { type: 'created', payload: { value: 0 } },
    state: { type: 'active', value: 0 }
  },
  {
    command: {
      operation: 'increment',
      id: { type: 'counter', id: '123' }
    },
    event: { type: 'added', payload: { value: 1, isMax: false } },
    state: { type: 'active', value: 1 }
  },
  {
    command: {
      operation: 'decrement',
      id: { type: 'counter', id: '123' }
    },
    event: { type: 'subtracted', payload: { value: 1 } },
    state: { type: 'active', value: 0 }
  },
  {
    command: {
      operation: 'increment',
      id: { type: 'counter', id: '123' }
    },
    event: { type: 'added', payload: { value: 1, isMax: false } },
    state: { type: 'active', value: 1 }
  }
]

describe('counter aggregate test with test library', () => {
  test('counter#1: increment and decrement', () => {
    const results = aggregateTest(counter, cases)
    for (const result of results) {
      expect(result.expected).toEqual(result.actual)
    }
  })
})

const eventCases: EventUnitTestCase<CounterEvent>[] = [
  {
    event: {
      type: 'created',
      id: { type: 'counter', id: '123' },
      payload: { value: 0 },
      version: 1,
      timestamp: new Date()
    },
    command: {
      operation: 'increment',
      id: { type: 'counter', id: '123' }
    },
    preReadModels: [],
    readModels: [
      {
        data: {
          count: 0,
          id: {
            id: '123',
            type: 'userCounter'
          }
        } as UserCounterReadModel,
        id: '123',
        type: 'userCounter'
      }
    ] as ReadModelRecord<UserCounterReadModel>[]
  },
  {
    event: {
      type: 'added',
      id: { type: 'counter', id: '123' },
      payload: { value: 1, isMax: true },
      version: 1,
      timestamp: new Date()
    },
    command: {
      operation: 'reset',
      id: { type: 'counter', id: '123' }
    },
    preReadModels: [],
    readModels: []
  }
]

describe('counter listener test with test library', () => {
  test('counter#1: increment and decrement', async () => {
    const results = await eventListenerTest(counterListener, eventCases)
    for (const result of results) {
      expect(result.expected).toEqual(result.actual)
    }
  })
})
