import type { Aggregate } from '../../types/aggregate'
import type { EventListener } from '../../types/eventListener'
import type {
  IntegrationTestCase,
  IntegrationTestResult
} from '../../types/testCase'
import { FakeHandler } from '../fake/fakeHandler'

export async function integrationTest(
  aggregates: Aggregate[],
  listeners: EventListener[],
  cases: IntegrationTestCase
): Promise<IntegrationTestResult> {
  const handler = new FakeHandler(aggregates, listeners)

  for (const command of cases.commands) {
    await handler.command(command)
  }

  return {
    expected: {
      events: cases.events,
      readModels: cases.readModels
    },
    actual: {
      events: handler.getEvents(),
      readModels: handler.getReadModels()
    }
  }
}
