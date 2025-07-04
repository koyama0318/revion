import { describe, expect, it } from 'bun:test'
import type { ExtendedDomainEvent } from '../../../src'
import { id } from '../../../src'
import { createDispatchEventFnFactory } from '../../../src/event/fn/dispatch-event'
import type { CounterEvent } from '../../data/command/counter'
import { counterReactor } from '../../data/command/counter'

describe('dispatch event function', () => {
  it('should return ok when event is dispatched', async () => {
    // Arrange
    const dispatch = async _ => Promise.resolve()
    const eventFn = createDispatchEventFnFactory(counterReactor.policy)({ dispatch })
    const event = {
      event: { type: 'created' },
      aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
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
    const dispatch = async _ => {
      throw new Error('test')
    }
    const eventFn = createDispatchEventFnFactory(counterReactor.policy)({ dispatch })
    const event = {
      event: { type: 'created' },
      aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
      version: 1,
      timestamp: new Date()
    } as ExtendedDomainEvent<CounterEvent>

    // Act
    const res = await eventFn(event)

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('COMMAND_DISPATCH_FAILED')
    }
  })
})
