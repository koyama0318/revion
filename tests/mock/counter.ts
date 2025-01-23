import type { Emitter } from '../../src/types/reducer'
import type { AggregateId } from '../../src/types/aggregate'
import type { CaseReducers } from '../../src/types/caseReducer'
import { makeAggregate } from '../../src/aggregate'

type CounterState =
  | { type: 'initial'; value: number }
  | { type: 'updated'; value: number }

type CounterCommand =
  | { type: 'create'; id: AggregateId; payload: object }
  | { type: 'increment'; id: AggregateId; payload: object }
  | { type: 'decrement'; id: AggregateId; payload: object }

type CounterEvent =
  | { type: 'created'; payload: { value: number } }
  | { type: 'added'; payload: { value: number } }
  | { type: 'subtracted'; payload: { value: number } }

const initialState: CounterState = { type: 'initial', value: 0 }

const emitter: Emitter<CounterState, CounterCommand, CounterEvent> = (
  state,
  command
) => {
  switch (command.type) {
    case 'create':
      return { type: 'created', payload: { value: state.value } }
    case 'increment':
      return { type: 'added', payload: { value: 1 } }
    case 'decrement':
      return { type: 'subtracted', payload: { value: 1 } }
  }
}

const reducer: CaseReducers<CounterState, CounterEvent> = {
  created: state => {
    if (state.type === 'initial') {
      state = { type: 'updated', value: 0 }
    }
  },
  added: (state, event) => {
    state.value += event.payload.value
  },
  subtracted: (state, event) => {
    state.value -= event.payload.value
  }
}

export const counter = makeAggregate('counter', initialState, emitter, reducer)

export { initialState, emitter, reducer }
export type { CounterState, CounterCommand, CounterEvent }
