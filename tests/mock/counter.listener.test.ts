import { describe, expect, test } from 'bun:test'
import { makeEventListener } from '../../src/eventListener'
import type { EventUnitTestCase } from '../../src/types/testCase'
import { eventListenerTest } from '../../src/unitTest'
import type { CounterEvent } from './counter'
import { policy } from './counter'
import { projection } from './counter.listener'

describe('counter listener test with test library', () => {
  const listener = makeEventListener('counter', policy, projection)
  const UnitTestCases: EventUnitTestCase<CounterEvent>[] = [
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
  const results = eventListenerTest(listener, UnitTestCases)

  for (const result of results) {
    test(result.label, () => {
      expect(result.expected).toEqual(result.output)
    })
  }
})
