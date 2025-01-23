import { describe, it, expect } from 'bun:test'
import type { CounterState, CounterCommand, CounterEvent } from './counter'
import { initialState, emitter, reducer } from './counter'

describe('counter aggregate test', () => {
  it('handle create command on initial state', () => {
    const command: CounterCommand = {
      type: 'create',
      id: { type: 'counter', id: '123' },
      payload: {}
    }
    const event = emitter(initialState, command)
    const state = reducer(initialState, event)

    expect(event).toEqual({ type: 'created', payload: { value: 0 } })
    expect(state).toEqual({ type: 'updated', value: 0 })
  })

  it('handle commands on initial state', () => {
    const commands: CounterCommand[] = [
      { type: 'create', id: { type: 'counter', id: '123' }, payload: {} },
      { type: 'increment', id: { type: 'counter', id: '123' }, payload: {} },
      { type: 'decrement', id: { type: 'counter', id: '123' }, payload: {} },
      { type: 'increment', id: { type: 'counter', id: '123' }, payload: {} }
    ]

    const events: CounterEvent[] = []
    let state: CounterState = initialState
    for (const command of commands) {
      const event = emitter(state, command)
      events.push(event)
      state = reducer(state, event)
    }

    expect(events).toEqual([
      { type: 'created', payload: { value: 0 } },
      { type: 'added', payload: { value: 1 } },
      { type: 'subtracted', payload: { value: 1 } },
      { type: 'added', payload: { value: 1 } }
    ])
    expect(state).toEqual({ type: 'updated', value: 1 })
  })
})
