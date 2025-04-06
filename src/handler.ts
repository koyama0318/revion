import { extendCommand } from './extendReducer'
import type { Aggregate, Event } from './types/aggregate'
import type { CommandDispatcher } from './types/dispatcher'
import type { EventListener } from './types/eventListener'
import type { EventStore } from './types/eventStore'
import type { Query, QueryDefinition, QueryResultType } from './types/query'
import type { ReadModelStore } from './types/readModelStore'
import type { ReducerCommand } from './types/reducer'
import type {
  ICommandWorkflow,
  IEventListenerWorkflow,
  IQueryWorkflow
} from './types/workflow'
import {
  CommandWorkflow,
  EventListenerWorkflow
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
    const aggregateType = command.id.type
    const factory = this.aggregateFactories.get(aggregateType)
    if (!factory) {
      throw new Error(`Aggregate for type ${aggregateType} not found`)
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

export class QueryHandler<T extends QueryDefinition[]> {
  readonly workflow: IQueryWorkflow<T>

  constructor(workflow: IQueryWorkflow<T>) {
    this.workflow = workflow
  }

  async query<Q extends Query>(query: Q): Promise<QueryResultType<Q, T>> {
    return await this.workflow.execute(query)
  }
}

export class QueryHandler2 {
  readonly workflow: IQueryWorkflow

  constructor(definitions: AAA) {
    this.workflow = new QueryWorkflow(definitions.definitions)
  }

  async query<Q extends Query>(query: Q): Promise<QueryResultType<Q, T>> {
    return await this.workflow.execute(query)
  }
}

class AAA {
  constructor(
    public readonly definitions: QueryDefinition[]
  ) {}
}