import { test, expect } from 'bun:test'
import type {
  ReducerCommand,
  ReducerEvent,
  ReducerState
} from './types/reducer'
import type { Aggregate } from './types/aggregate'
import type { TestCase } from './types/testCase'

export function testAggregate<
  S extends ReducerState,
  C extends ReducerCommand,
  E extends ReducerEvent
>(aggregate: Aggregate, cases: TestCase<C, S, E>[]) {
  aggregate.reset()
  cases.forEach(({ label, command, expectedEvent, expectedState }, index) => {
    test(`${aggregate.type}#${index + 1}: ${label}`, () => {
      aggregate.processCommand(command)

      expect(aggregate.state).toEqual({
        ...expectedState,
        version: expect.any(Number)
      })

      expect(aggregate.uncommittedEvents).toEqual([
        {
          ...expectedEvent,
          id: { type: aggregate.type, id: expect.any(String) },
          version: expect.any(Number),
          timestamp: expect.any(Date)
        }
      ])

      aggregate.commitEvents()
    })
  })
}
