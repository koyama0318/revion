import { describe } from 'bun:test'
import { testAggregate } from '../../src/test'
import type { TestCase } from '../../src/types/testCase'
import type { CounterCommand, CounterEvent, CounterState } from './counter'
import { counter } from './counter'

describe('counter aggregate test with test library', () => {
  const cases: TestCase<CounterCommand, CounterState, CounterEvent>[] = [
    {
      label: 'create command',
      command: {
        type: 'create',
        id: { type: 'counter', id: '123' },
        payload: {}
      },
      expectedEvent: { type: 'created', payload: { value: 0 } },
      expectedState: { type: 'updated', value: 0 }
    },
    {
      label: 'increment command',
      command: {
        type: 'increment',
        id: { type: 'counter', id: '123' },
        payload: {}
      },
      expectedEvent: { type: 'added', payload: { value: 1, isMax: false } },
      expectedState: { type: 'updated', value: 1 }
    },
    {
      label: 'decrement command',
      command: {
        type: 'decrement',
        id: { type: 'counter', id: '123' },
        payload: {}
      },
      expectedEvent: { type: 'subtracted', payload: { value: 1 } },
      expectedState: { type: 'updated', value: 0 }
    },
    {
      label: 'increment command',
      command: {
        type: 'increment',
        id: { type: 'counter', id: '123' },
        payload: {}
      },
      expectedEvent: { type: 'added', payload: { value: 1, isMax: false } },
      expectedState: { type: 'updated', value: 1 }
    }
  ]
  testAggregate(counter, cases)
})
