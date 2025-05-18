import type { EventDeciderFn, ReducerFn } from '../../../../src'
import { createAggregate } from '../../../../src'
import type { CounterCommand, CounterEvent, CounterId, CounterState } from './types'

const stateInit = (id: CounterId): CounterState => ({
  id,
  count: 0
})

const decider: EventDeciderFn<CounterState, CounterCommand, CounterEvent> = {
  create: _ => {
    return { type: 'created' }
  },
  increment: _ => {
    return { type: 'incremented' }
  },
  decrement: _ => {
    return { type: 'decremented' }
  },
  delete: _ => {
    return { type: 'deleted' }
  }
}

const reducer: ReducerFn<CounterState, CounterEvent> = {
  created: state => {
    state.count = 0
  },
  incremented: state => {
    state.count += 1
  },
  decremented: state => {
    state.count -= 1
  },
  deleted: state => {
    state.count = 0
  }
}

export const counter = createAggregate({
  type: 'counter',
  stateInit,
  decider,
  reducer
})
