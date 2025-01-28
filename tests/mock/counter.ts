import { makeAggregate } from '../../src/aggregate'
import type { AggregateId } from '../../src/types/aggregate'
import type { CasePolicies } from '../../src/types/eventListener'
import type { CaseEmitters, CaseReducers } from '../../src/types/reducer'

type CounterState =
  | { type: 'initial'; value: number }
  | { type: 'updated'; value: number }

type CounterCommand =
  | { type: 'create'; id: AggregateId; payload: object }
  | { type: 'increment'; id: AggregateId; payload: object }
  | { type: 'decrement'; id: AggregateId; payload: object }
  | { type: 'reset'; id: AggregateId; payload: object }

type CounterEvent =
  | { type: 'created'; payload: { value: number } }
  | { type: 'added'; payload: { value: number; isMax: boolean } }
  | { type: 'subtracted'; payload: { value: number } }
  | { type: 'reseted'; payload: object }

const emitter: CaseEmitters<CounterState, CounterCommand, CounterEvent> = {
  create: state => ({
    type: 'created',
    payload: { value: state.value }
  }),
  increment: state => ({
    type: 'added',
    payload: { value: 1, isMax: state.value + 1 > 10 }
  }),
  decrement: () => ({ type: 'subtracted', payload: { value: 1 } }),
  reset: () => ({ type: 'reseted', payload: {} })
}

const reducer: CaseReducers<CounterState, CounterEvent> = {
  created: state => {
    return { ...state, type: 'updated', value: 0 }
  },
  added: (state, event) => {
    return { ...state, value: state.value + event.payload.value }
  },
  subtracted: (state, event) => {
    return { ...state, value: state.value - event.payload.value }
  },
  reseted: state => {
    return { ...state, value: 0 }
  }
}

const policy: CasePolicies<CounterEvent> = {
  created: event => ({
    type: 'increment',
    id: event.id,
    payload: {}
  }),
  added: event =>
    event.payload.isMax
      ? {
          type: 'reset',
          id: event.id,
          payload: {}
        }
      : undefined,
  subtracted: () => undefined,
  reseted: () => undefined
}

export const initialState: CounterState = { type: 'initial', value: 0 }
export const counter = makeAggregate('counter', initialState, emitter, reducer)

export { emitter, policy, reducer }
export type { CounterCommand, CounterEvent, CounterState }
