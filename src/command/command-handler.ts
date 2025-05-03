import type {
  Command,
  CommandHandler,
  CommandHandlerDeps,
  CommandHandlerFactory,
  DomainEvent,
  EventDecider,
  Reducer,
  State
} from '../types/command'
import type {
  LiteCommand,
  LiteDomainEvent,
  LiteEventDecider,
  LiteReducer,
  LiteState
} from '../types/command-lite'
import type { AppError } from '../types/error'
import type { EventStore } from '../types/event-store'
import type { AggregateId } from '../types/id'
import type { AsyncResult } from '../utils/result'
import { err } from '../utils/result'
import { extendLiteEventDecider, extendLiteReducer } from './command-lite'
import { replayState } from './replay-state'
import { saveEvents } from './save-events'

export const SNAPSHOT_INTERVAL = 100

class CommandProcessor<S extends State, C extends Command, E extends DomainEvent> {
  constructor(
    private readonly initState: (id: AggregateId) => S,
    private readonly eventDecider: EventDecider<S, C, E>,
    private readonly reducer: Reducer<S, E>,
    private readonly eventStore: EventStore
  ) {}

  async handle(command: C): AsyncResult<void, AppError> {
    const state = await replayState({
      aggregateId: command.aggregateId,
      initState: this.initState,
      reducer: this.reducer,
      eventStore: this.eventStore
    })
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

    return saveEvents({ events, state: nextState, eventStore: this.eventStore })
  }
}

const createCommandHandler = <
  S extends State,
  C extends Command,
  E extends DomainEvent,
  CD extends CommandHandlerDeps
>(
  initState: (id: AggregateId) => S,
  eventDecider: EventDecider<S, C, E>,
  reducer: Reducer<S, E>
): CommandHandlerFactory<CD> => {
  return (deps: CD): CommandHandler => {
    if (!deps.eventStore) {
      throw new Error('Event store is required')
    }
    const processor = new CommandProcessor(initState, eventDecider, reducer, deps.eventStore)

    return (command: Command): AsyncResult<void, AppError> => {
      return processor.handle(command as C)
    }
  }
}

export const createLiteCommandHandler = <
  LS extends LiteState,
  LC extends LiteCommand,
  LE extends LiteDomainEvent,
  CD extends CommandHandlerDeps = CommandHandlerDeps
>(
  initState: (id: AggregateId) => LS,
  eventDecider: LiteEventDecider<LS, LC, LE>,
  reducer: LiteReducer<LS, LE>
): CommandHandlerFactory<CD> => {
  const init = (id: AggregateId): State => {
    return { ...initState(id), version: 0 }
  }
  const ed = extendLiteEventDecider(eventDecider)
  const re = extendLiteReducer(reducer)

  return createCommandHandler(init, ed, re)
}
