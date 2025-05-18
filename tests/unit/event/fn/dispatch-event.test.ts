import { describe, expect, it } from 'bun:test'
import { createDispatchEventFnFactory } from '../../../../src/event/fn/dispatch-event'
import type { ExtendedDomainEvent } from '../../../../src/types'
import { err, ok } from '../../../../src/utils'
import type { CounterEvent } from '../../../fixtures/command/counter'
import { counterReactor } from '../../../fixtures/command/counter'

describe('dispatch event function', () => {
  it('should return ok when event is dispatched', async () => {
    // Arrange
    const dispatch = async _ => ok(undefined)
    const eventFn = createDispatchEventFnFactory(counterReactor.policy)({ dispatch })
    const event = {
      event: { type: 'created' },
      aggregateId: { type: 'counter', id: '1' },
      version: 1,
      timestamp: new Date()
    } as ExtendedDomainEvent<CounterEvent>

    // Act
    const res = await eventFn(event)

    // Assert
    expect(res.ok).toBe(true)
  })

  it('should return error when event is not dispatched', async () => {
    // Arrange
    const dispatch = async _ => err({ code: 'DISPATCH_ERROR', message: 'Dispatch error' })
    const eventFn = createDispatchEventFnFactory(counterReactor.policy)({ dispatch })
    const event = {
      event: { type: 'created' },
      aggregateId: { type: 'counter', id: '1' },
      version: 1,
      timestamp: new Date()
    } as ExtendedDomainEvent<CounterEvent>

    // Act
    const res = await eventFn(event)

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('DISPATCH_ERROR')
    }
  })
})
