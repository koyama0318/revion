import { type Result, err, ok } from 'neverthrow'
import type { AggregateId, AggregateType } from '../types/aggregate-id'
import type { AppError } from '../types/app-error'
import type { Command } from '../types/command'
import type {
  EventDecider,
  ICommandAggregate,
  Reducer,
  State
} from '../types/command-aggregate'
import type { DomainEvent, DomainEventPayload } from '../types/domain-event'
import { generateUuid } from '../utils/id'

export class CommandAggregate<
  S extends State,
  C extends Command,
  P extends DomainEventPayload
> implements ICommandAggregate
{
  private state: S
  private events: DomainEvent<DomainEventPayload>[]
  private version: number
  private readonly decider: EventDecider<S, C, P>
  private readonly reducer: Reducer<S>

  constructor(
    initialState: S,
    decider: EventDecider<S, C, P>,
    reducer: Reducer<S>
  ) {
    this.state = initialState
    this.events = []
    this.version = 0
    this.decider = decider
    this.reducer = reducer
  }

  private rehydrate(events: DomainEvent<DomainEventPayload>[]): void {
    for (const event of events) {
      this.state = this.reducer(this.state, event)
      if (event.version > this.version) {
        this.version = event.version
      }
    }
  }

  private reduce(event: DomainEvent<DomainEventPayload>): void {
    this.state = this.reducer(this.state, event)
    this.version = event.version
    this.events.push(event)
  }

  getAggregateType(): AggregateType {
    return this.state.aggregateType
  }

  getAggregateId(): AggregateId {
    return this.state.aggregateId
  }

  getState(): S {
    return this.state
  }

  getVersion(): number {
    return this.version
  }

  loadFromHistory(events: DomainEvent<DomainEventPayload>[]): void {
    this.rehydrate(events)
    this.events = []
  }

  restoreVersion(version: number): void {
    if (version >= 0) {
      this.version = version
      this.events = []
    }
  }

  dispatch(command: C): Result<DomainEvent<DomainEventPayload>[], AppError> {
    const eventPayloadsResult = this.decider(this.state, command)

    if (eventPayloadsResult.isErr()) {
      return err(eventPayloadsResult.error)
    }

    const eventPayloads = eventPayloadsResult.value
    const generatedEvents: DomainEvent<DomainEventPayload>[] = []
    let currentVersion = this.version

    for (const payload of eventPayloads) {
      const eventVersion = currentVersion + 1
      const event: DomainEvent<DomainEventPayload> = {
        eventId: generateUuid(),
        aggregateType: command.aggregateType,
        aggregateId: command.aggregateId,
        eventType: command.operation,
        version: eventVersion,
        payload,
        timestamp: new Date()
      }
      this.reduce(event)
      generatedEvents.push(event)
      currentVersion = eventVersion
    }

    return ok(generatedEvents)
  }
}
