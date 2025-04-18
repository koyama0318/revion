import { z } from 'zod'
import type { Command } from '../types/command'
import type { EventDecider, Reducer, State } from '../types/command-aggregate'
import type { CommandHandler, CommandHandlerFactory } from '../types/command-bus'
import type { DomainEvent } from '../types/domain-event'
import type { AppError } from '../types/error'
import type { EventStore } from '../types/event-store'
import type { AggregateId } from '../types/id'
import type { AsyncResult } from '../utils/result'
import { err, ok } from '../utils/result'

export const SNAPSHOT_INTERVAL = 20

const stateSchema = z.object({
  aggregateId: z.string(),
  version: z.number()
})

class CommandProcessor<S extends State, C extends Command, E extends DomainEvent> {
  constructor(
    private readonly initState: (id: AggregateId) => S,
    private readonly eventDecider: EventDecider<S, C, E>,
    private readonly reducer: Reducer<S, E>,
    private readonly eventStore: EventStore
  ) {}

  async handle(command: C): AsyncResult<void, AppError> {
    const state = await this.replay(command.aggregateId)
    if (!state.ok) {
      return err(state.error)
    }

    const newEvents = this.eventDecider(state.value, command)
    if (!newEvents.ok) {
      return err(newEvents.error)
    }
    if (newEvents.value.length === 0) {
      return err({
        code: 'NO_EVENTS_GENERATED',
        message: 'No events generated'
      })
    }

    const events = newEvents.value
    const nextState = newEvents.value.reduce(this.reducer, state.value)

    return this.saveEvents(events, nextState)
  }

  private async replay(aggregateId: AggregateId): AsyncResult<S, AppError> {
    let state = this.initState(aggregateId) as S
    let currentVersion = 0

    const snapshot = await this.eventStore.getSnapshot(aggregateId)
    if (!snapshot.ok) {
      return err({
        code: 'SNAPSHOT_CANNOT_BE_LOADED',
        message: 'Snapshot cannot be loaded',
        cause: snapshot.error
      })
    }
    if (snapshot.value && snapshot.value !== null) {
      const data = snapshot.value.data as S
      if (!('aggregateId' in data && 'version' in data)) {
        return err({
          code: 'INVALID_SNAPSHOT_DATA',
          message: 'Snapshot data does not satisfy State interface'
        })
      }

      state = data
      currentVersion = snapshot.value.version
    }

    const events = await this.eventStore.getEvents(aggregateId, currentVersion)
    if (!events.ok) {
      return err({
        code: 'EVENTS_CANNOT_BE_LOADED',
        message: 'Events cannot be loaded',
        cause: events.error
      })
    }

    const nextState = events.value.reduce<S>((currentState, event) => {
      return this.reducer(currentState, event as E)
    }, state)

    return ok(nextState)
  }

  private async saveEvents(events: E[], state: S): AsyncResult<void, AppError> {
    const lastEventVersion = await this.eventStore.getLastEventVersion(state.aggregateId)
    if (!lastEventVersion.ok) {
      return err({
        code: 'LAST_EVENT_VERSION_CANNOT_BE_LOADED',
        message: 'Last event version cannot be loaded',
        cause: lastEventVersion.error
      })
    }

    if (events[0].version !== lastEventVersion.value + 1) {
      return err({
        code: 'CONFLICT',
        message: `Event version mismatch: ${events[0].version}, ${lastEventVersion.value + 1}`
      })
    }

    if ((state.version % SNAPSHOT_INTERVAL) + events.length >= SNAPSHOT_INTERVAL) {
      const snapshot = {
        aggregateId: state.aggregateId,
        version: state.version,
        timestamp: new Date(),
        data: state
      }

      const result = await this.eventStore.saveSnapshot(snapshot)
      if (!result.ok) {
        return err({
          code: 'SNAPSHOT_CANNOT_BE_SAVED',
          message: 'Snapshot cannot be saved',
          cause: result.error
        })
      }
    }

    const result = await this.eventStore.saveEvents(events)
    if (!result.ok) {
      return err({
        code: 'EVENTS_CANNOT_BE_SAVED',
        message: 'Events cannot be saved',
        cause: result.error
      })
    }

    return ok(undefined)
  }
}

export const createCommandHandler = <S extends State, C extends Command, E extends DomainEvent>(
  initState: (id: AggregateId) => S,
  eventDecider: EventDecider<S, C, E>,
  reducer: Reducer<S, E>
): CommandHandlerFactory => {
  return (eventStore: EventStore): CommandHandler => {
    const processor = new CommandProcessor(initState, eventDecider, reducer, eventStore)

    return (command: Command): AsyncResult<void, AppError> => {
      return processor.handle(command as C)
    }
  }
}
