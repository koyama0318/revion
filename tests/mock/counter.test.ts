import { describe, expect, test } from 'bun:test'
import type { UnitTestCase } from '../../src/types/testCase'
import { aggregateTest } from '../../src/unitTest'
import type { CounterCommand, CounterEvent, CounterState } from './counter'
import { counter } from './counter'

const cases: UnitTestCase<CounterCommand, CounterState, CounterEvent>[] = [
  {
    command: {
      type: 'create',
      id: { type: 'counter', id: '123' }
    },
    event: { type: 'created', payload: { value: 0 } },
    state: { type: 'updated', value: 0 }
  },
  {
    command: {
      type: 'increment',
      id: { type: 'counter', id: '123' }
    },
    event: { type: 'added', payload: { value: 1, isMax: false } },
    state: { type: 'updated', value: 1 }
  },
  {
    command: {
      type: 'decrement',
      id: { type: 'counter', id: '123' }
    },
    event: { type: 'subtracted', payload: { value: 1 } },
    state: { type: 'updated', value: 0 }
  },
  {
    command: {
      type: 'increment',
      id: { type: 'counter', id: '123' }
    },
    event: { type: 'added', payload: { value: 1, isMax: false } },
    state: { type: 'updated', value: 1 }
  }
]

describe('counter aggregate test with test library', () => {
  test(`counter#1: increment and decrement`, () => {
    const results = aggregateTest(counter, cases)
    for (const result of results) {
      expect(result.expected).toEqual(result.actual)
    }
  })
})
