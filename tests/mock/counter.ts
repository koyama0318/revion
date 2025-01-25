import type { AggregateId } from '../../src/types/aggregate'
import type { CaseEmitters, CaseReducers } from '../../src/types/caseReducer'
import { makeAggregate } from '../../src/aggregate'

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
    state.type = 'updated'
    state.value = 0
  },
  added: (state, event) => {
    state.value += event.payload.value
  },
  subtracted: (state, event) => {
    state.value -= event.payload.value
  },
  reseted: state => {
    state.value = 0
  }
}

export const initialState: CounterState = { type: 'initial', value: 0 }
export const counter = makeAggregate('counter', initialState, emitter, reducer)

export type { CounterState, CounterCommand, CounterEvent }
export { emitter, reducer }
