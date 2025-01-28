import type { Aggregate } from './types/aggregate'
import type { EventListener } from './types/eventListener'
import type {
  ReducerCommand,
  ReducerEvent,
  ReducerState
} from './types/reducer'
import type {
  EventUnitTestCase,
  EventUnitTestResult,
  UnitTestCase,
  UnitTestResult
} from './types/testCase'

export function aggregateTest<
  S extends ReducerState,
  C extends ReducerCommand,
  E extends ReducerEvent
>(aggregate: Aggregate, cases: UnitTestCase<C, S, E>[]): UnitTestResult[] {
  aggregate.reset()

  const results: UnitTestResult[] = []
  cases.forEach(({ label, command, expectedEvent, expectedState }, index) => {
    aggregate.processCommand(command)

    const lastEvent = aggregate.uncommittedEvents.at(-1)
    if (!lastEvent) {
      throw new Error('No uncommitted events found')
    }

    aggregate.commitEvents()

    results.push({
      label: `${aggregate.type}#${index + 1}: ${label}`,
      expected: {
        state: { ...aggregate.state, ...expectedState },
        eventType: expectedEvent.type,
        eventPayload: expectedEvent.payload
      },
      output: {
        state: aggregate.state,
        eventType: lastEvent.type,
        eventPayload: lastEvent.payload
      }
    })
  })

  return results
}

export function eventListenerTest<E extends ReducerEvent>(
  listener: EventListener,
  cases: EventUnitTestCase<E>[]
): EventUnitTestResult[] {
  const results: EventUnitTestResult[] = []

  cases.forEach(({ label, event, expectedCommand }, index) => {
    const command = listener.policy(event)
    results.push({
      label: `${listener.type}#${index + 1}: ${label}`,
      expected: { command: expectedCommand },
      output: { command }
    })
  })

  return results
}
