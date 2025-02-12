import type { Aggregate } from '../../types/aggregate'
import type { EventListener } from '../../types/eventListener'
import type {
  ReducerCommand,
  ReducerEvent,
  ReducerState
} from '../../types/reducer'
import type {
  EventUnitTestCase,
  EventUnitTestResult,
  UnitTestCase,
  UnitTestResult
} from '../../types/testCase'
import { ReadModelStoreInMemory } from '../fake/storeInMemory'

export function aggregateTest<
  S extends ReducerState,
  C extends ReducerCommand,
  E extends ReducerEvent
>(aggregate: Aggregate, cases: UnitTestCase<C, S, E>[]): UnitTestResult[] {
  aggregate.reset()

  const results: UnitTestResult[] = []
  cases.forEach(({ command, event, state }) => {
    aggregate.processCommand(command)

    const lastEvent = aggregate.uncommittedEvents.at(-1)
    if (!lastEvent) {
      throw new Error('No uncommitted events found')
    }

    aggregate.commitEvents()

    results.push({
      expected: {
        state: { ...aggregate.state, ...state },
        eventType: event.type,
        eventPayload: event.payload
      },
      actual: {
        state: aggregate.state,
        eventType: lastEvent.type,
        eventPayload: lastEvent.payload
      }
    })
  })

  return results
}

export async function eventListenerTest<E extends ReducerEvent>(
  listener: EventListener,
  cases: EventUnitTestCase<E>[]
): Promise<EventUnitTestResult[]> {
  const results: EventUnitTestResult[] = []

  cases.forEach(async ({ event, command, preReadModels, readModels }) => {
    const actualCommand = listener.policy(event)

    const store = new ReadModelStoreInMemory(preReadModels)
    await listener.projection(store, event)

    results.push({
      expected: {
        command,
        readModels: readModels
      },
      actual: {
        command: actualCommand,
        readModels: store.records
      }
    })
  })

  return results
}
