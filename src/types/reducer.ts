import type { AggregateId } from './aggregate'

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

export type Reducer<S extends ReducerState, E extends ReducerEvent> = (
  state: S,
  event: E
) => S
