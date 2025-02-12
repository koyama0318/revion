import type { Command, Event } from './aggregate'
import type { ReadModelStore } from './readModelStore'
import type { ReducerEvent } from './reducer'

export type Policy<E extends ReducerEvent> = (
  event: E & Event
) => Command | undefined

export type CasePolicies<E extends ReducerEvent> = {
  [K in E['type']]?: Policy<Extract<E, { type: K }>>
}

export type Projection<E extends ReducerEvent> = (
  store: ReadModelStore,
  event: E & Event
) => Promise<void>

export type CaseProjections<E extends ReducerEvent> = {
  [K in E['type']]: Projection<Extract<E, { type: K }>>
}

export interface EventListener {
  type: string
  policy: Policy<ReducerEvent>
  projection: Projection<ReducerEvent>
}
