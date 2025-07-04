import type { Draft } from 'immer'
import type { Command, DomainEvent, State } from './command'
import type { PolicyFn } from './event-reactor'
import type { EventDeciderFn } from './reducer'

export type CaseEventDeciderFn<S extends State, C extends Command, E extends DomainEvent> = {
  [K in C['operation']]: EventDeciderFn<S, Extract<C, { operation: K }>, E>
}

export type CaseReducerFn<S extends State, E extends DomainEvent> = {
  [K in E['type']]: (state: Draft<S>, event: Extract<E, { type: K }>) => void
}

export type CasePolicyFn<C extends Command, E extends DomainEvent> = {
  [K in E['type']]?: PolicyFn<C, Extract<E, { type: K }>>
}
