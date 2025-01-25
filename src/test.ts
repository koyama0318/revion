import { test, expect } from 'bun:test'
import type {
  ReducerCommand,
  ReducerEvent,
  ReducerState
} from './types/reducer'
import type { Aggregate } from './types/aggregate'
import type { TestCase, TestCaseEvent } from './types/testCase'
import type { EventListener } from './types/eventListener'

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
        ...aggregate.state,
        ...expectedState
      })

      const lastEvent = aggregate.uncommittedEvents.at(-1)
      if (!lastEvent) {
        throw new Error('No uncommitted events found')
      }

      expect(lastEvent.type).toBe(expectedEvent.type)
      expect(lastEvent.payload).toEqual(expectedEvent.payload)

      aggregate.commitEvents()
    })
  })
}

export function testListener<E extends ReducerEvent>(
  listener: EventListener,
  cases: TestCaseEvent<E>[]
) {
  cases.forEach(({ label, event, expectedCommand }, index) => {
    test(`${listener.type}#${index + 1}: ${label}`, () => {
      const command = listener.policy(event)
      expect(command).toEqual(expectedCommand)
    })
  })
}
