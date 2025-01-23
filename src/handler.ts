import type { ReducerCommand } from './types/reducer'
import type { Aggregate } from './types/aggregate'
import type { EventStore } from './types/eventStore'
import type { CommandWorkflow } from './types/workflow'
import { Workflow } from './workflow'
import { extendCommand } from './extendReducer'

export class Handler {
  private readonly workflow: CommandWorkflow
  private readonly aggregateFactories: Map<string, () => Aggregate>

  constructor(eventStore: EventStore) {
    this.workflow = new Workflow(eventStore)
    this.aggregateFactories = new Map()
  }

  register(aggregates: Aggregate[]): void {
    for (const aggregate of aggregates) {
      this.aggregateFactories.set(aggregate.type, () => aggregate)
    }
  }

  dispatch(command: ReducerCommand): void {
    const type = command.id.type
    const factory = this.aggregateFactories.get(type)
    if (!factory) {
      throw new Error(`Aggregate for type ${type} not found`)
    }

    const aggregate = factory()
    this.workflow.execute(aggregate, extendCommand(command))
  }
}
