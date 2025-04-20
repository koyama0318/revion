import type { Command, DomainEvent, EventDecider, Reducer, State } from '../types/command'
import type {
  LiteCommand,
  LiteDomainEvent,
  LiteEventDecider,
  LiteReducer,
  LiteState
} from '../types/command-lite'
import type { AppError } from '../types/error'
import { type Result, ok } from '../utils/result'

const extendLiteState = (version: number): ((state: LiteState) => State) => {
  return (state: LiteState): State => {
    return {
      ...state,
      version
    }
  }
}

const extendLiteEvent = (version: number): ((event: LiteDomainEvent) => DomainEvent) => {
  return (event: LiteDomainEvent): DomainEvent => {
    return {
      ...event,
      version,
      timestamp: new Date()
    }
  }
}

export const extendLiteEventDecider = <
  LS extends LiteState,
  LC extends LiteCommand,
  LE extends LiteDomainEvent
>(
  liteEventDecider: LiteEventDecider<LS, LC, LE>
): EventDecider<State, Command, DomainEvent> => {
  return (state: State, command: Command): Result<DomainEvent[], AppError> => {
    const { version, ...liteState } = state
    const liteEvent = liteEventDecider(liteState as LS, command as LC)
    if (liteEvent.ok) {
      return ok(liteEvent.value.map(extendLiteEvent(state.version + 1)))
    }
    return liteEvent
  }
}

export const extendLiteReducer = <LS extends LiteState, LE extends LiteDomainEvent>(
  liteReducer: LiteReducer<LS, LE>
): Reducer<State, DomainEvent> => {
  return (state: State, event: DomainEvent): State => {
    const { version, ...liteState } = state
    const { version: _, timestamp, ...liteEvent } = event
    const nextState = liteReducer(liteState as LS, liteEvent as LE)
    return extendLiteState(event.version)(nextState)
  }
}
