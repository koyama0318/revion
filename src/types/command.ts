import type { AggregateId } from './aggregate-id'

export type State = {
  id: AggregateId
}

export type ExtendedState<T extends State> = {
  readonly state: Readonly<T>
  readonly version: number
}

export type Command = {
  readonly operation: string
  readonly id: AggregateId
  readonly payload?: unknown
}

export type CommandResult = {
  id: AggregateId
}

export type DomainEvent = {
  type: string
  payload?: unknown
}

export type EventFor<T extends string, E extends DomainEvent> = Extract<E, { type: T }>

export type ExtendedDomainEvent<T extends DomainEvent> = {
  readonly event: Readonly<T>
  readonly aggregateId: AggregateId
  readonly version: number
  readonly timestamp: Date
}

export type Snapshot<S extends State> = {
  readonly state: S
  readonly version: number
  readonly timestamp: Date
}
