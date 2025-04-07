import type { Aggregate, Command, Event } from './aggregate'
import type { CommandDispatcher } from './dispatcher'
import type { EventListener } from './eventListener'
import type { Query, QueryResult } from './query'
import type { EventStore } from './store'

export interface ICommandWorkflow {
  eventStore: EventStore
  execute(aggregate: Aggregate, command: Command): Promise<void>
}

export interface IEventListenerWorkflow {
  dispatcher: CommandDispatcher
  receive(listener: EventListener, event: Event): Promise<void>
}

export interface IQueryWorkflow { 
  execute(query: Query): Promise<QueryResult>
}
