import type { State } from './command-aggregate'
import type { AggregateId, AggregateType } from './id'

/** Represents a snapshot of an aggregate's state at a specific version. */
export interface Snapshot<S extends State> {
  /** The unique identifier of the aggregate instance. */
  readonly aggregateId: AggregateId
  /** The type name of the aggregate. */
  readonly aggregateType: AggregateType
  /** The captured state of the aggregate. */
  readonly state: S
  /** The version number of the aggregate state when the snapshot was taken. */
  readonly version: number
  /** Optional: The ID of the last event included in this snapshot state. */
  readonly lastEventId?: string
  /** The date and time when the snapshot was created. */
  readonly timestamp: Date
}
