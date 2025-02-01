import type { Aggregate, Command, Event } from './aggregate'
import type { CommandDispatcher } from './dispatcher'
import type { EventListener } from './eventListener'
import type { EventStore } from './eventStore'

export interface ICommandWorkflow {
  eventStore: EventStore
  execute(aggregate: Aggregate, command: Command): Promise<void>
}

export interface IEventListenerWorkflow {
  dispatcher: CommandDispatcher
  receive(listener: EventListener, event: Event): Promise<void>
}
