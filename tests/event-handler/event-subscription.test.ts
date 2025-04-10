import { beforeEach, describe, expect, test } from 'bun:test'
import { okAsync } from 'neverthrow'
import type { AggregateId, AggregateType, DomainEvent } from '../../src'
import { createEventSubscription } from '../../src/event-handler/subscription'

describe('EventSubscription', () => {
  let subscription: ReturnType<typeof createEventSubscription>
  let processedEvents: DomainEvent<{ eventType: string }>[] = []
  const testAggregateType = 'test-aggregate' as AggregateType
  const testAggregateId = 'test-id' as AggregateId

  const mockEventStore = {
    loadEvents: async (fromVersion: number, limit: number) => {
      return []
    }
  }

  const mockHandler = (event: DomainEvent<{ eventType: string }>) => {
    processedEvents.push(event)
    return okAsync(undefined)
  }

  beforeEach(() => {
    processedEvents = []
    subscription = createEventSubscription(mockEventStore, mockHandler, {
      name: 'test-subscription',
      pollInterval: 100,
      batchSize: 10
    })
  })

  test('should start and stop subscription', async () => {
    const startResult = await subscription.start()
    expect(startResult.isOk()).toBe(true)

    const stopResult = await subscription.stop()
    expect(stopResult.isOk()).toBe(true)
  })
})
