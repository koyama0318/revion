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
  readonly isNew?: boolean
  readonly payload?: unknown
}

export type DomainEvent = {
  type: string
  payload?: unknown
}

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
