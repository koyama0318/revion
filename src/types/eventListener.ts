import type { Policy, ReducerEvent } from './reducer'

export type Projection<E extends ReducerEvent> = (event: E) => void

export interface EventListener {
  type: string
  policy: Policy<ReducerEvent>
  projection: Projection<ReducerEvent>
}
