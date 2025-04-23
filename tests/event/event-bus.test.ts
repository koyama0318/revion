import { describe, expect, it } from 'bun:test'
import { EventBus } from '../../src/event/event-bus'
import type { DomainEvent } from '../../src/types/command'
import type { EventHandler } from '../../src/types/event'
import { ok } from '../../src/utils/result'

const mockEvent: DomainEvent = {
  aggregateId: 'test#01963f1e-96b3-7000-944d-68549ad889a2',
  eventType: 'doSomething',
  version: 1,
  timestamp: new Date(),
  payload: {}
}

function setupHandlers(): Record<string, EventHandler> {
  return { test: async _ => ok(undefined) }
}

describe('EventBus', () => {
  it('should call handler if valid event is dispatched', async () => {
    const bus = new EventBus(setupHandlers())
    const result = await bus.receive(mockEvent)

    expect(result.ok).toBe(true)
    expect(result).toEqual(ok(undefined))
  })

  it('should return error if aggregateId is invalid', async () => {
    const invalidEvent = { ...mockEvent, aggregateId: 'invalid' }
    const bus = new EventBus(setupHandlers())
    const result = await bus.receive(invalidEvent as DomainEvent)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_AGGREGATE_ID')
    }
  })

  it('should return error if handler for aggregate type is not found', async () => {
    const bus = new EventBus({})
    const result = await bus.receive(mockEvent)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('HANDLER_NOT_FOUND')
    }
  })
})
