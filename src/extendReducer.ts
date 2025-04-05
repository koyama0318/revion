import type { Command, Event, State } from './types/aggregate'
import type {
  Emitter,
  Reducer,
  ReducerCommand,
  ReducerEvent,
  ReducerState
} from './types/reducer'

export function extendState(state: ReducerState): State {
  return {
    ...state,
    version: 0
  }
}

export function extendCommand(command: ReducerCommand): Command {
  return {
    type: command.type,
    id: command.id,
    payload: command.payload
  }
}

export function extendEmitter(
  emitter: Emitter<ReducerState, ReducerCommand, ReducerEvent>
): Emitter<State, Command, Event> {
  return (state: State, command: Command) => {
    const event = emitter(state, command)
    return {
      ...event,
      id: command.id,
      version: state.version + 1,
      timestamp: new Date()
    }
  }
}

export function extendReducer(
  reducer: Reducer<ReducerState, ReducerEvent>
): Reducer<State, Event> {
  return (state: State, event: Event) => {
    const newState = reducer(state, event)
    if (event.version !== state.version + 1) {
      throw new Error('Version mismatch')
    }
    return {
      ...newState,
      version: event.version
    }
  }
}
