import type { Command, Aggregate } from './aggregate'
import type { EventStore } from './eventStore'

export interface CommandWorkflow {
  eventStore: EventStore
  execute(aggregate: Aggregate, command: Command): void
}
