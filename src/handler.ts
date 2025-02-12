import { extendCommand } from './extendReducer'
import type { Aggregate, Event } from './types/aggregate'
import type { CommandDispatcher } from './types/dispatcher'
import type { EventListener } from './types/eventListener'
import type { EventStore } from './types/eventStore'
import type { Query, ReadModel } from './types/query'
import type { ReadModelStore } from './types/readModelStore'
import type { ReducerCommand } from './types/reducer'
import type {
  ICommandWorkflow,
  IEventListenerWorkflow,
  IQueryWorkflow
} from './types/workflow'
import {
  CommandWorkflow,
  EventListenerWorkflow,
  QueryWorkflow
} from './workflow'

export class CommandHandler {
  readonly workflow: ICommandWorkflow
  readonly aggregateFactories: Map<string, () => Aggregate>

  constructor(eventStore: EventStore, aggregates: Aggregate[] = []) {
    this.workflow = new CommandWorkflow(eventStore)

    this.aggregateFactories = new Map()
    for (const aggregate of aggregates) {
      this.aggregateFactories.set(aggregate.type, () => aggregate)
    }
  }

  async handle(command: ReducerCommand): Promise<void> {
    const type = command.id.type
    const factory = this.aggregateFactories.get(type)
    if (!factory) {
      throw new Error(`Aggregate for type ${type} not found`)
    }

    const aggregate = factory().reset()
    await this.workflow.execute(aggregate, extendCommand(command))
  }
}

export class EventHandler {
  private readonly workflow: IEventListenerWorkflow
  private readonly listenerFactories: Map<string, () => EventListener>

  constructor(
    dispatcher: CommandDispatcher,
    store: ReadModelStore,
    listeners: EventListener[] = []
  ) {
    this.workflow = new EventListenerWorkflow(dispatcher, store)
    this.listenerFactories = new Map()
    for (const listener of listeners) {
      this.listenerFactories.set(listener.type, () => listener)
    }
  }

  async handle(event: Event): Promise<void> {
    const listener = this.listenerFactories.get(event.id.type)
    if (!listener) {
      console.warn(`Listener for type ${event.id.type} not found`)
      return
    }

    await this.workflow.receive(listener(), event)
  }
}

export class QueryHandler {
  readonly workflow: IQueryWorkflow

  constructor(store: ReadModelStore) {
    this.workflow = new QueryWorkflow(store)
  }

  async query<T extends ReadModel>(query: Query<T>): Promise<T[]> {
    return await this.workflow.query(query)
  }
}
