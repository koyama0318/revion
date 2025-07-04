import type {
  Command,
  DomainEvent,
  ExtendedDomainEvent,
  PolicyFn,
  ProjectionFn,
  ViewMap
} from '../types'
import type { CasePolicyFn } from '../types/case'

export type EventReactor<
  T extends string,
  C extends Command,
  E extends DomainEvent,
  VM extends ViewMap
> = {
  type: T
  policy: PolicyFn<C, E>
  projection: ProjectionFn<E, VM>
}

// biome-ignore lint/suspicious/noExplicitAny:
export type AnyEventReactor = EventReactor<any, any, any, any>

function fromCasePolicy<C extends Command, E extends DomainEvent>(
  casePolicy: CasePolicyFn<C, E>
): PolicyFn<C, E> {
  return (event: ExtendedDomainEvent<E>): C | null => {
    const handler = casePolicy[event.event.type as keyof CasePolicyFn<C, E>]
    if (!handler) return null
    return (
      handler(event as ExtendedDomainEvent<Extract<E, { type: typeof event.event.type }>>) ?? null
    )
  }
}

export function createEventReactor<
  T extends string,
  C extends Command,
  E extends DomainEvent,
  VM extends ViewMap
>({
  type,
  policy,
  projection
}: {
  type: T
  policy: CasePolicyFn<C, E>
  projection: ProjectionFn<E, VM>
}): EventReactor<T, C, E, VM> {
  return {
    type,
    policy: fromCasePolicy(policy),
    projection
  }
}
