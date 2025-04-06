import type { Aggregate, Command, Event } from './types/aggregate'
import type { CommandDispatcher } from './types/dispatcher'
import type { EventListener } from './types/eventListener'
import type { EventStore } from './types/eventStore'
import type { OperationHandlers, Query, QueryDefinition, QueryResultType } from './types/query'
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
  constructor(public handlers: OperationHandlers<QueryDefinition[]>) {}

  async execute<Q extends Query, QD extends QueryDefinition[]>(query: Q): Promise<QueryResultType<Q, QD>> {
    const { operation } = query;

    const handler = this.handlers[operation as keyof OperationHandlers<QueryDefinition[]>];
    if (!handler) {
      throw new Error(`Unknown operation: ${operation}`);
    }

    return handler(query as any) as QueryResultType<Q, QD>;
  }
}
