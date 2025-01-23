import type { Emitter, Reducer } from '../../src/types/reducer'
import type { AggregateId } from '../../src/types/aggregate'
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
      if (state.type === 'initial') {
        return { type: 'created', payload: { value: state.value } }
      }
      break
    case 'increment':
      return { type: 'added', payload: { value: 1 } }
    case 'decrement':
      return { type: 'subtracted', payload: { value: 1 } }
  }
  throw new Error('Invalid command')
}

const reducer: Reducer<CounterState, CounterEvent> = (state, event) => {
  switch (event.type) {
    case 'created':
      return { type: 'updated', value: 0 }
    case 'added':
      return { type: 'updated', value: state.value + event.payload.value }
    case 'subtracted':
      return { type: 'updated', value: state.value - event.payload.value }
  }
}

export const counter = makeAggregate('counter', initialState, emitter, reducer)

export { initialState, emitter, reducer }
export type { CounterState, CounterCommand, CounterEvent }
