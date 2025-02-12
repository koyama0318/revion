import type { Aggregate, Command, Event } from './types/aggregate'
import type { CommandDispatcher } from './types/dispatcher'
import type { EventListener } from './types/eventListener'
import type { EventStore } from './types/eventStore'
import type { Query, ReadModel } from './types/query'
import type { ReadModelStore } from './types/readModelStore'
import type {
  ICommandWorkflow,
  IEventListenerWorkflow,
  IQueryWorkflow
} from './types/workflow'

export class CommandWorkflow implements ICommandWorkflow {
  constructor(public eventStore: EventStore) {}

  async execute(aggregate: Aggregate, command: Command) {
    const storedEvents = await this.eventStore.load(command.id)
    aggregate.applyEvents(storedEvents).processCommand(command)

    const events = aggregate.uncommittedEvents
    this.eventStore.save(events)
    aggregate.commitEvents()
  }
}

export class EventListenerWorkflow implements IEventListenerWorkflow {
  constructor(
    public dispatcher: CommandDispatcher,
    public store: ReadModelStore
  ) {}

  async receive(listener: EventListener, event: Event): Promise<void> {
    await listener.projection(this.store, event)

    const command = listener.policy(event)
    if (command) {
      await this.dispatcher.dispatch(command)
    }
  }
}

export class QueryWorkflow implements IQueryWorkflow {
  constructor(public store: ReadModelStore) {}

  async query<T extends ReadModel>(query: Query<T>): Promise<T[]> {
    if (query.id) {
      const item = await this.store.fetchById(query)
      return item ? [item] : []
    }
    return this.store.fetchAll(query)
  }
}
