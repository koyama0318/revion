import type { AggregateId, Command, Event } from './aggregate'

export interface ReducerState {
  type: string
}

export interface ReducerCommand {
  type: string
  id: AggregateId
  payload: unknown
}

export interface ReducerEvent {
  type: string
  payload: unknown
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
  [K in C['type']]: Emitter<S, Extract<C, { type: K }>, E>
}

export type Reducer<S extends ReducerState, E extends ReducerEvent> = (
  state: S,
  event: E
) => S

export type CaseReducer<S extends ReducerState, E extends ReducerEvent> = (
  state: S,
  event: E
) => void

export type CaseReducers<S extends ReducerState, E extends ReducerEvent> = {
  [K in E['type']]: CaseReducer<S, Extract<E, { type: K }>>
}

export type Policy<E extends ReducerEvent> = (
  event: E & Event
) => Command | undefined

export type CasePolicies<E extends ReducerEvent> = {
  [K in E['type']]: Policy<Extract<E, { type: K }>>
}
