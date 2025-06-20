import type {
  AggregateId,
  Command,
  DomainEvent,
  ExtendedDomainEvent,
  ExtendedState,
  State
} from '../types'
import { isEqualId } from '../utils'
import type { Aggregate, AnyAggregate } from './aggregate'
import type { CommandHandlerDeps } from './command-handler'
import { createApplyEventFnFactory } from './fn/apply-event'
import { createReplayEventFnFactory } from './fn/replay-event'
import { createSaveEventFnFactory } from './fn/save-event'

import type { ReplayEventOptions } from './fn/replay-event'

type CombinedReplayEventFn = <S extends State>(
  id: AggregateId,
  options?: ReplayEventOptions
) => Promise<ExtendedState<S> | null>

export type CombinedApplyEventFn = <S extends State, C extends Command, E extends DomainEvent>(
  state: ExtendedState<S>,
  command: C
) => {
  state: ExtendedState<S>
  events: ExtendedDomainEvent<E>[]
}

export type CombinedSaveEventFn = (
  state: ExtendedState<State>,
  events: ExtendedDomainEvent<DomainEvent>[]
) => Promise<void>

export type CombinedFns = {
  replayFn: CombinedReplayEventFn
  applyFn: CombinedApplyEventFn
  saveFn: CombinedSaveEventFn
}

export type CombinedFnFactory = (deps: CommandHandlerDeps) => CombinedFns

export function createCombinedReplayFn(
  deps: CommandHandlerDeps,
  aggregates: AnyAggregate[]
): CombinedReplayEventFn {
  return async <S extends State>(
    id: AggregateId,
    options?: ReplayEventOptions
  ): Promise<ExtendedState<S> | null> => {
    let aggregate: AnyAggregate | undefined
    for (const agg of aggregates) {
      if (agg.type === id.type) {
        aggregate = agg
        break
      }
    }
    if (aggregate === undefined) {
      return null
    }

    const result = await createReplayEventFnFactory(aggregate.stateInit, aggregate.reducer)(deps)(
      id,
      options
    )
    if (!result.ok) return null

    return result.value as ExtendedState<S>
  }
}

export function createCombinedApplyFn(aggregates: AnyAggregate[]): CombinedApplyEventFn {
  return <S extends State, C extends Command, E extends DomainEvent>(
    state: ExtendedState<S>,
    command: C
  ): {
    state: ExtendedState<S>
    events: ExtendedDomainEvent<E>[]
  } => {
    if (!isEqualId(state.state.id, command.id)) {
      throw new Error('state and command are id mismatch')
    }

    let aggregate: Aggregate<typeof command.id.type, S, C, E> | undefined
    for (const agg of aggregates) {
      if (agg.type === command.id.type) {
        aggregate = agg
        break
      }
    }
    if (aggregate === undefined) {
      throw new Error('aggregate is not registered')
    }

    const result = createApplyEventFnFactory(aggregate.eventDecider, aggregate.reducer)()(
      state,
      command
    )
    if (!result.ok) {
      const log = `state: ${state}, command: ${command}, code: ${result.error.code}, message: ${result.error.message}`
      throw new Error(log)
    }

    return result.value as {
      state: ExtendedState<S>
      events: ExtendedDomainEvent<E>[]
    }
  }
}

export function createCombinedSaveFn(deps: CommandHandlerDeps): CombinedSaveEventFn {
  return async (
    state: ExtendedState<State>,
    events: ExtendedDomainEvent<DomainEvent>[]
  ): Promise<void> => {
    const saveFn = createSaveEventFnFactory()(deps)

    const result = await saveFn(state, events)
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`)
  }
}
