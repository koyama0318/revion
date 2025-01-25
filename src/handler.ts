import { extendCommand } from './extendReducer'
import type { Aggregate, Event } from './types/aggregate'
import type { CommandDispatcher } from './types/commandDispatcher'
import type { EventListener } from './types/eventListener'
import type { EventStore } from './types/eventStore'
import type { ReducerCommand } from './types/reducer'
import type { ICommandWorkflow, IEventListenerWorkflow } from './types/workflow'
import { CommandWorkflow, EventListenerWorkflow } from './workflow'

export class CommandHandler {
  private readonly workflow: ICommandWorkflow
  private readonly aggregateFactories: Map<string, () => Aggregate>

  constructor(eventStore: EventStore, aggregates: Aggregate[] = []) {
    this.workflow = new CommandWorkflow(eventStore)

    this.aggregateFactories = new Map()
    for (const aggregate of aggregates) {
      this.aggregateFactories.set(aggregate.type, () => aggregate)
    }
  }

  handle(command: ReducerCommand): void {
    const type = command.id.type
    const factory = this.aggregateFactories.get(type)
    if (!factory) {
      throw new Error(`Aggregate for type ${type} not found`)
    }

    const aggregate = factory()
    this.workflow.execute(aggregate, extendCommand(command))
  }
}

export class EventHandler {
  private readonly workflow: IEventListenerWorkflow
  private readonly listenerFactories: Map<string, () => EventListener>

  constructor(dispatcher: CommandDispatcher, listeners: EventListener[] = []) {
    this.workflow = new EventListenerWorkflow(dispatcher)
    this.listenerFactories = new Map()
    for (const listener of listeners) {
      this.listenerFactories.set(listener.type, () => listener)
    }
  }

  handle(event: Event): void {
    const listener = this.listenerFactories.get(event.type)
    if (!listener) {
      console.warn(`Listener for type ${event.type} not found`)
      return
    }

    this.workflow.receive(listener(), event)
  }
}
