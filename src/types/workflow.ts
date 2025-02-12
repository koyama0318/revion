import type { Aggregate, Command, Event } from './aggregate'
import type { CommandDispatcher } from './dispatcher'
import type { EventListener } from './eventListener'
import type { EventStore } from './eventStore'
import type { Query, ReadModel } from './query'
import type { ReadModelStore } from './readModelStore'

export interface ICommandWorkflow {
  eventStore: EventStore
  execute(aggregate: Aggregate, command: Command): Promise<void>
}

export interface IEventListenerWorkflow {
  dispatcher: CommandDispatcher
  store: ReadModelStore
  receive(listener: EventListener, event: Event): Promise<void>
}

export interface IQueryWorkflow {
  store: ReadModelStore
  query<T extends ReadModel>(query: Query<T>): Promise<T[]>
}
