import type { Command, Event } from './types/aggregate'
import type {
  CasePolicies,
  CaseProjections,
  EventListener,
  Policy,
  Projection
} from './types/eventListener'
import type { ReadModelStore } from './types/readModelStore'
import type { ReducerEvent } from './types/reducer'

function mergePolicy<E extends ReducerEvent>(
  policies: CasePolicies<E>
): Policy<E> {
  return (event: E & Event): Command | undefined => {
    const fn = policies[event.type as keyof typeof policies]
    if (fn) {
      return fn(event as Extract<E, { type: E['type'] }> & Event)
    }
    return undefined
  }
}

function mergeProjection<E extends ReducerEvent>(
  projections: CaseProjections<E>
): Projection<E> {
  return async (store: ReadModelStore, event: E): Promise<void> => {
    const fn = projections[event.type as keyof typeof projections]
    if (fn) {
      return fn(store, event as Extract<E, { type: E['type'] }> & Event)
    }
    return Promise.resolve()
  }
}

export function baseMakeEventListener<E extends ReducerEvent>(
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

export function makeEventListener<E extends ReducerEvent>(
  type: string,
  policy: CasePolicies<E>,
  projection: CaseProjections<E>
): EventListener {
  const mergedPolicy = mergePolicy(policy)
  const mergedProjection = mergeProjection(projection)
  return {
    type,
    policy: mergedPolicy as Policy<ReducerEvent>,
    projection: mergedProjection as Projection<ReducerEvent>
  }
}
