import type { Command, Event, Aggregate } from './aggregate'
import type { EventStore } from './eventStore'
import type { EventListener } from './eventListener'
import type { CommandDispatcher } from './commandDispatcher'

export interface ICommandWorkflow {
  eventStore: EventStore
  execute(aggregate: Aggregate, command: Command): void
}

export interface IEventListenerWorkflow {
  dispatcher: CommandDispatcher
  receive(listener: EventListener, event: Event): void
}
