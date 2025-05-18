import type { AggregateId } from './aggregate-id'
import type { Command, DomainEvent, State } from './command'

export type StateInitFn<T extends string, S extends State> = (id: AggregateId<T>) => S

export type EventDeciderFn<S extends State, C extends Command, E extends DomainEvent> = (
  state: S,
  command: C
) => E | E[]

export type ReducerFn<S extends State, E extends DomainEvent> = (state: S, event: E) => S
