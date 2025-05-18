import type { Command, DomainEvent, ExtendedDomainEvent } from './command'
import type { View, ViewMap } from './view'

export type PolicyFn<C extends Command, E extends DomainEvent> = (
  event: ExtendedDomainEvent<E>
) => C | null

export type ProjectionDefinition<E extends DomainEvent, V extends View> =
  | {
      init: (event: ExtendedDomainEvent<E>) => V
    }
  | {
      id: (event: ExtendedDomainEvent<E>) => string
      apply: (event: ExtendedDomainEvent<E>, draft: V) => void
    }
  | {
      deleteId: (event: ExtendedDomainEvent<E>) => string
    }

export type ProjectionFn<E extends DomainEvent, V extends ViewMap> = {
  [T in E['type']]?: {
    [K in keyof V]?: ProjectionDefinition<E, V[K]>
  }
}
