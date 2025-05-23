import { produce } from 'immer'
import type {
  CaseEventDeciderFn,
  CaseReducerFn,
  Command,
  DomainEvent,
  EventDeciderFn,
  ReducerFn,
  State,
  StateInitFn
} from '../types'

export type Aggregate<
  T extends string,
  S extends State,
  C extends Command,
  E extends DomainEvent
> = {
  type: T
  stateInit: StateInitFn<T, S>
  eventDecider: EventDeciderFn<S, C, E>
  reducer: ReducerFn<S, E>
}

// biome-ignore lint/suspicious/noExplicitAny:
export type AnyAggregate = Aggregate<any, any, any, any>

function fromCaseEventDecider<S extends State, C extends Command, E extends DomainEvent>(
  caseEventDecider: CaseEventDeciderFn<S, C, E>
): EventDeciderFn<S, C, E> {
  return (state, command) =>
    caseEventDecider[command.operation as keyof CaseEventDeciderFn<S, C, E>](
      state,
      command as Extract<C, { operation: C['operation'] }>
    )
}

function fromCaseReducers<S extends State, E extends DomainEvent>(
  caseReducers: CaseReducerFn<S, E>
): ReducerFn<S, E> {
  return (state, event) => {
    const reducer = caseReducers[event.type as E['type']]
    if (!reducer) return state

    return produce(state, draft => {
      reducer(draft, event as Extract<E, { type: E['type'] }>)
    })
  }
}

export function createAggregate<
  T extends string,
  S extends State,
  C extends Command,
  E extends DomainEvent
>({
  type,
  stateInit,
  decider,
  reducer
}: {
  type: T
  stateInit: StateInitFn<T, S>
  decider: CaseEventDeciderFn<S, C, E>
  reducer: CaseReducerFn<S, E>
}): Aggregate<T, S, C, E> {
  return {
    type,
    stateInit,
    eventDecider: fromCaseEventDecider(decider),
    reducer: fromCaseReducers(reducer)
  }
}
