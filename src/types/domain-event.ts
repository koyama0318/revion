import type { AggregateId } from './id'

export interface DomainEvent {
  readonly aggregateId: AggregateId
  readonly eventType: string
  readonly version: number
  readonly timestamp: Date
  readonly payload?: unknown
}

export interface Snapshot {
  readonly aggregateId: AggregateId
  readonly version: number
  readonly timestamp: Date
  readonly data: unknown
}
