import type { Event, Command, Aggregate } from './types/aggregate'
import type { EventStore } from './types/eventStore'
import type { ICommandWorkflow, IEventListenerWorkflow } from './types/workflow'
import type { EventListener } from './types/eventListener'
import type { CommandDispatcher } from './types/commandDispatcher'

export class CommandWorkflow implements ICommandWorkflow {
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

export class EventListenerWorkflow implements IEventListenerWorkflow {
  dispatcher: CommandDispatcher

  constructor(dispatcher: CommandDispatcher) {
    this.dispatcher = dispatcher
  }

  receive(listener: EventListener, event: Event): void {
    const command = listener.policy(event)
    if (command) {
      this.dispatcher.dispatch(command)
    }

    listener.projection(event)
  }
}
