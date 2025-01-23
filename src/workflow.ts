import type { Command, Aggregate } from './types/aggregate'
import type { EventStore } from './types/eventStore'
import type { CommandWorkflow } from './types/workflow'

export class Workflow implements CommandWorkflow {
  eventStore: EventStore

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore
  }

  execute(aggregate: Aggregate, command: Command) {
    const storedEvents = this.eventStore.load(command.id)
    aggregate.applyEvents(storedEvents).processCommand(command)

    const events = aggregate.uncommittedEvents
    this.eventStore.save(events)
    aggregate.commitEvents()
  }
}
