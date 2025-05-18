import type {
  AppError,
  Command,
  DomainEvent,
  EventDeciderFn,
  ExtendedDomainEvent,
  ExtendedState,
  ReducerFn,
  Result,
  State
} from '../../types'
import { err, ok, toResult } from '../../utils'

type ApplyEventFn<S extends State, C extends Command, E extends DomainEvent> = (
  state: ExtendedState<S>,
  command: C
) => Result<
  {
    state: ExtendedState<S>
    events: ExtendedDomainEvent<E>[]
  },
  AppError
>

export function createApplyEventFnFactory<
  S extends State,
  C extends Command,
  E extends DomainEvent
>(eventDecider: EventDeciderFn<S, C, E>, reducer: ReducerFn<S, E>): () => ApplyEventFn<S, C, E> {
  return () => {
    return (state: ExtendedState<S>, command: C) => {
      const e = toResult(() => eventDecider(state.state, command))
      if (!e.ok) {
        return err({
          code: 'EVENT_DECIDER_ERROR',
          message: 'Event decider error',
          cause: e.error
        })
      }

      const events: E[] = Array.isArray(e.value) ? e.value : [e.value]
      if (events.length === 0) {
        return err({
          code: 'NO_EVENTS_GENERATED',
          message: 'No events generated'
        })
      }

      let lastVersion = state.version
      const newExtendedEvents: ExtendedDomainEvent<E>[] = events.map(event => {
        lastVersion += 1
        return {
          event,
          aggregateId: state.state.id,
          version: lastVersion,
          timestamp: new Date()
        }
      })

      const newState = events.reduce((state, event) => {
        return reducer(state, event)
      }, state.state)

      const newExtendedState: ExtendedState<S> = {
        state: newState,
        version: lastVersion
      }

      return ok({
        state: newExtendedState,
        events: newExtendedEvents
      })
    }
  }
}
