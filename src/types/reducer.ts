import type { AggregateId } from './aggregate'

export interface ReducerState {
  type: string
}

export interface ReducerCommand {
  operation: string
  id: AggregateId
  payload?: unknown
}

export interface ReducerEvent {
  type: string
  payload?: unknown
}

export type Emitter<
  S extends ReducerState,
  C extends ReducerCommand,
  E extends ReducerEvent
> = (state: S, command: C) => E

export type CaseEmitters<
  S extends ReducerState,
  C extends ReducerCommand,
  E extends ReducerEvent
> = {
  [K in C['operation']]: Emitter<S, Extract<C, { operation: K }>, E>
}

export type Reducer<S extends ReducerState, E extends ReducerEvent> = (
  state: S,
  event: E
) => S

export type CaseReducers<S extends ReducerState, E extends ReducerEvent> = {
  [K in E['type']]: Reducer<S, Extract<E, { type: K }>>
}
