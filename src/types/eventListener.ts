import type { Event, Command } from './aggregate'
import type { ReducerEvent } from './reducer'

export type Policy<E extends ReducerEvent> = (
  event: E & Event
) => Command | undefined

export type Projection<E extends ReducerEvent> = (event: E) => void

export interface EventListener {
  type: string
  policy: Policy<ReducerEvent>
  projection: Projection<ReducerEvent>
}
