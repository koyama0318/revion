import type { ReducerState, ReducerEvent, ReducerCommand } from './reducer'

export type CaseEmitter<
  S extends ReducerState,
  C extends ReducerCommand,
  E extends ReducerEvent
> = (state: S, command: C) => E

export type CaseEmitters<
  S extends ReducerState,
  C extends ReducerCommand,
  E extends ReducerEvent
> = {
  [K in C['type']]: CaseEmitter<S, Extract<C, { type: K }>, E>
}

export type CaseReducer<S extends ReducerState, E extends ReducerEvent> = (
  state: S,
  event: E
) => void

export type CaseReducers<S extends ReducerState, E extends ReducerEvent> = {
  [K in E['type']]: CaseReducer<S, Extract<E, { type: K }>>
}
