import type { Command, DomainServiceFn } from '../types'

export type DomainService<T extends string, C extends Command> = {
  type: T
  applyEvent: DomainServiceFn<C>
}

// biome-ignore lint/suspicious/noExplicitAny:
export type AnyDomainService = DomainService<any, any>

export const createDomainService = <T extends string, C extends Command>(
  type: T,
  applyEvent: DomainServiceFn<C>
): DomainService<T, C> => {
  return {
    type,
    applyEvent
  }
}
