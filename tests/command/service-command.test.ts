import { beforeEach, describe, expect, it } from 'bun:test'
import { createLiteServiceCommandHandler } from '../../src/command/service-command-handler'
import type { EventStore } from '../../src/types/event-store'
import { EventStoreInMemory } from '../../src/utils/event-store-in-memory'
import { ok } from '../../src/utils/result'
import { type CounterEvent, type CounterServiceCommand, counterReplayer } from '../fixtures/counter'
import { serviceFactory } from '../fixtures/counter/counter-command-service'

describe('LiteServiceCommandHandler', () => {
  let eventStore: EventStore

  beforeEach(() => {
    eventStore = new EventStoreInMemory()
  })

  it('should return error if snapshot save fails', async () => {
    eventStore.saveEvents([
      {
        aggregateId: 'counter#00000000-0000-0000-0000-000000000001',
        eventType: 'create',
        version: 1,
        timestamp: new Date(),
        payload: { amount: 10 }
      },
      {
        aggregateId: 'counter#00000000-0000-0000-0000-000000000001',
        eventType: 'increment',
        version: 2,
        timestamp: new Date(),
        payload: { amount: 1 }
      }
    ])

    const factory = createLiteServiceCommandHandler(serviceFactory, [counterReplayer])
    const handler = factory({
      eventStore,
      repo: { getCount: async () => 1 }
    })

    const command: CounterServiceCommand = {
      aggregateId: 'counterService#00000000-0000-0000-0000-000000000000',
      operation: 'calculate',
      payload: { amount: 3, counterId: 'counter#00000000-0000-0000-0000-000000000001' }
    }
    const result = await handler(command)

    const list = await eventStore.getEvents('counter#00000000-0000-0000-0000-000000000001')
    const events = list as CounterEvent[]
    console.log(events)

    expect(result).toEqual(ok(undefined))
    expect(events.length).toBe(3)
    expect(events[0].eventType).toBe('created')
    expect(events[1].eventType).toBe('increment')
    expect(events[2].eventType).toBe('increment')
    expect(events[2].payload.amount).toEqual(14)
  })
})
