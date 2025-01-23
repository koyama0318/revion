import type { ReducerState, ReducerEvent } from './reducer'

export type CaseReducer<S extends ReducerState, E extends ReducerEvent> = (
  state: S,
  event: E
) => void

export type CaseReducers<S extends ReducerState, E extends ReducerEvent> = {
  [K in E['type']]: CaseReducer<S, Extract<E, { type: K }>>
}
