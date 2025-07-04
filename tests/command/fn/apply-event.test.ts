import { describe, expect, it } from 'bun:test'
import { err, id } from '../../../src'
import { createApplyEventFnFactory } from '../../../src/command/fn/apply-event'
import type { ExtendedDomainEvent, ExtendedState } from '../../../src/types'
import type { CounterCommand, CounterEvent, CounterState } from '../../data/command/counter'
import { counter } from '../../data/command/counter'

describe('apply event function', () => {
  it('should return ok when events are generated', async () => {
    // Arrange
    const applyEventFn = createApplyEventFnFactory(counter.eventDecider, counter.reducer)()

    const state: ExtendedState<CounterState> = {
      state: {
        id: id('counter', '00000000-0000-0000-0000-000000000001'),
        count: 0
      },
      version: 0
    }

    const command: CounterCommand = {
      operation: 'create',
      id: id('counter', '00000000-0000-0000-0000-000000000001')
    }

    // Act
    const res = applyEventFn(state, command)

    // Assert
    const expectedState: ExtendedState<CounterState> = {
      state: {
        id: id('counter', '00000000-0000-0000-0000-000000000001'),
        count: 0
      },
      version: 1
    }

    const expectedEvents: ExtendedDomainEvent<CounterEvent>[] = [
      {
        event: { type: 'created' as const },
        aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
        version: 1,
        timestamp: expect.any(Date)
      }
    ]

    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.value.state).toEqual(expectedState)
      expect(res.value.events).toEqual(expectedEvents)
    }
  })

  it('should return error when no events are generated', async () => {
    // Arrange
    const emptyDecider = _ => []
    const applyEventFn = createApplyEventFnFactory(emptyDecider, counter.reducer)()

    const state: ExtendedState<CounterState> = {
      state: {
        id: id('counter', '00000000-0000-0000-0000-000000000001'),
        count: 0
      },
      version: 0
    }

    const command: CounterCommand = {
      operation: 'increment',
      id: id('counter', '00000000-0000-0000-0000-000000000001')
    }

    // Act
    const res = applyEventFn(state, command)

    // Assert
    const expected = err({
      code: 'NO_EVENTS_GENERATED',
      message: 'No events generated'
    })

    expect(res).toEqual(expected)
  })

  it('should return error when event decider throws error', async () => {
    // Arrange
    const errDecider = _ => {
      throw new Error('error')
    }
    const applyEventFn = createApplyEventFnFactory(errDecider, counter.reducer)()

    const state: ExtendedState<CounterState> = {
      state: {
        id: id('counter', '00000000-0000-0000-0000-000000000001'),
        count: 0
      },
      version: 0
    }

    const command: CounterCommand = {
      operation: 'increment',
      id: id('counter', '00000000-0000-0000-0000-000000000001')
    }

    // Act
    const res = applyEventFn(state, command)

    // Assert
    const expected = err({
      code: 'EVENT_DECIDER_ERROR',
      message: 'Event decider error',
      cause: expect.any(Error)
    })

    expect(res).toEqual(expected)
  })
})
