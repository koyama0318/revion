import { describe } from 'bun:test'
import { makeEventListener } from '../../src/eventListener'
import { testListener } from '../../src/test'
import type { TestCaseEvent } from '../../src/types/testCase'
import type { CounterEvent } from './counter'
import { policy } from './counter'
import { projection } from './counter.listener'

describe('counter listener test with test library', () => {
  const listener = makeEventListener('counter', policy, projection)
  const testCases: TestCaseEvent<CounterEvent>[] = [
    {
      label: 'created event',
      event: {
        type: 'created',
        id: { type: 'counter', id: '123' },
        payload: { value: 0 },
        version: 1,
        timestamp: new Date()
      },
      expectedCommand: {
        type: 'increment',
        id: { type: 'counter', id: '123' },
        payload: {}
      }
    },
    {
      label: 'added event',
      event: {
        type: 'added',
        id: { type: 'counter', id: '123' },
        payload: { value: 1, isMax: true },
        version: 1,
        timestamp: new Date()
      },
      expectedCommand: {
        type: 'reset',
        id: { type: 'counter', id: '123' },
        payload: {}
      }
    }
  ]
  testListener(listener, testCases)
})
