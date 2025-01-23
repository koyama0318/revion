import type { State, Command, Event, Aggregate } from './types/aggregate'
import type {
  ReducerState,
  ReducerCommand,
  ReducerEvent,
  Emitter,
  Reducer
} from './types/reducer'
import { extendState, extendEmitter, extendReducer } from './extendReducer'
import type { CaseReducers } from './types/caseReducer'

export class AggregateImpl implements Aggregate {
  type: string
  initialState: State
  state: State
  events: Event[]
  uncommittedEvents: Event[]
  emitter: Emitter<State, Command, Event>
  reducer: Reducer<State, Event>

  constructor(
    type: string,
    initialState: State,
    emitter: Emitter<State, Command, Event>,
    reducer: Reducer<State, Event>
  ) {
    this.type = type
    this.initialState = initialState
    this.state = initialState
    this.events = []
    this.uncommittedEvents = []
    this.emitter = emitter
    this.reducer = reducer
  }

  processCommand(command: Command): this {
    const event = this.emitter(this.state, command)
    this.state = this.reducer(this.state, event)
    this.events.push(event)
    this.uncommittedEvents.push(event)
    return this
  }

  applyEvents(events: Event[]): this {
    events.forEach(event => this.applyEvent(event))
    return this
  }

  applyEvent(event: Event): this {
    this.state = this.reducer(this.state, event)
    this.events.push(event)
    return this
  }

  commitEvents(): this {
    this.uncommittedEvents = []
    return this
  }

  reset(): this {
    this.state = this.initialState
    this.events = []
    this.uncommittedEvents = []
    return this
  }
}

export function baseMakeAggregate<
  S extends ReducerState,
  C extends ReducerCommand,
  E extends ReducerEvent
>(
  type: string,
  initialState: S,
  emitter: Emitter<S, C, E>,
  reducer: Reducer<S, E>
): Aggregate {
  return new AggregateImpl(
    type,
    extendState(initialState),
    extendEmitter(
      emitter as unknown as Emitter<ReducerState, ReducerCommand, ReducerEvent>
    ),
    extendReducer(reducer as unknown as Reducer<ReducerState, ReducerEvent>)
  )
}

function mergeReducer<S extends ReducerState, E extends ReducerEvent>(
  reducer: CaseReducers<S, E>
): (state: S, event: E) => S {
  return (state: S, event: E): S => {
    const fn = reducer[event.type as keyof typeof reducer]
    if (fn) {
      fn(state, event as Extract<E, { type: E['type'] }>)
    }
    return state
  }
}

export function makeAggregate<
  S extends ReducerState,
  C extends ReducerCommand,
  E extends ReducerEvent
>(
  type: string,
  initialState: S,
  emitter: Emitter<S, C, E>,
  reducer: CaseReducers<S, E>
): Aggregate {
  const mergedReducer = mergeReducer(reducer)
  return baseMakeAggregate(type, initialState, emitter, mergedReducer)
}
