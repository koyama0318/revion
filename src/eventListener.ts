import type { ReducerEvent } from './types/reducer'
import type { Policy, Projection } from './types/eventListener'
import type { EventListener } from './types/eventListener'

export function makeEventListener<E extends ReducerEvent>(
  type: string,
  policy: Policy<E>,
  projection: Projection<E>
): EventListener {
  return {
    type,
    policy: policy as Policy<ReducerEvent>,
    projection: projection as Projection<ReducerEvent>
  }
}
