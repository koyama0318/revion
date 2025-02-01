import type { Aggregate, Command, Event } from './types/aggregate'
import type { CommandDispatcher } from './types/dispatcher'
import type { EventListener } from './types/eventListener'
import type { EventStore } from './types/eventStore'
import type { ICommandWorkflow, IEventListenerWorkflow } from './types/workflow'

export class CommandWorkflow implements ICommandWorkflow {
  eventStore: EventStore

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore
  }

  async execute(aggregate: Aggregate, command: Command) {
    const storedEvents = await this.eventStore.load(command.id)
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

  async receive(listener: EventListener, event: Event): Promise<void> {
    const command = listener.policy(event)
    if (command) {
      await this.dispatcher.dispatch(command)
    }

    listener.projection(event)
  }
}
