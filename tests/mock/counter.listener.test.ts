import { describe, expect, test } from 'bun:test'
import type { EventUnitTestCase } from '../../src/types/testCase'
import { eventListenerTest } from '../../src/unitTest'
import type { CounterEvent } from './counter'
import { counterListener } from './counter'

const cases: EventUnitTestCase<CounterEvent>[] = [
  {
    event: {
      type: 'created',
      id: { type: 'counter', id: '123' },
      payload: { value: 0 },
      version: 1,
      timestamp: new Date()
    },
    command: {
      type: 'increment',
      id: { type: 'counter', id: '123' },
      payload: {}
    }
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
      type: 'reset',
      id: { type: 'counter', id: '123' },
      payload: {}
    }
  }
]

describe('counter listener test with test library', () => {
  test(`counter#1: increment and decrement`, () => {
    const results = eventListenerTest(counterListener, cases)
    for (const result of results) {
      expect(result.expected).toEqual(result.actual)
    }
  })
})
