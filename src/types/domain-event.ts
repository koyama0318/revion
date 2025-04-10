import type { AggregateId, AggregateType } from './aggregate-id'

/** Base interface for the payload of a domain event. */
export interface DomainEventPayload {
  /** The specific type of the event payload. */
  readonly eventType: string
}

/** Represents a domain event that occurred within the system. */
export interface DomainEvent<Payload extends DomainEventPayload> {
  /** A unique identifier for this specific event instance (e.g., UUID). */
  readonly eventId: string // イベント自身のID (例: UUID)
  /** The type name of the event (often related to the command operation). */
  readonly eventType: string // イベントの種類 (コマンドの operation と関連)
  /** The type of the aggregate this event belongs to. */
  readonly aggregateType: AggregateType
  /** The unique identifier of the aggregate this event belongs to. */
  readonly aggregateId: AggregateId
  /** The sequence number of this event within the aggregate's history. */
  readonly version: number
  /** The actual data associated with the event. */
  readonly payload: Payload
  /** The date and time when the event occurred. */
  readonly timestamp: Date
}
