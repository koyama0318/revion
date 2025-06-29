import { v4 } from 'uuid'
import type {
  AggregateId,
  AppError,
  AsyncResult,
  DomainEvent,
  ExtendedState,
  ReducerFn,
  State,
  StateInitFn
} from '../../types'
import { isZero } from '../../types'
import { err, ok, toAsyncResult } from '../../utils'
import type { CommandHandlerDeps } from '../command-handler'

export type ReplayEventFn<T extends string, S extends State> = (
  id: AggregateId<T>
) => AsyncResult<ExtendedState<S>, AppError>

export function createReplayEventFnFactory<
  T extends string,
  S extends State,
  E extends DomainEvent,
  D extends CommandHandlerDeps
>(stateInit: StateInitFn<T, S>, reducer: ReducerFn<S, E>): (deps: D) => ReplayEventFn<T, S> {
  return (deps: D) => {
    return async (id: AggregateId<T>) => {
      if (isZero(id)) {
        const newId = v4()
        return ok({
          state: stateInit({ ...id, id: newId }) as S,
          version: 0
        })
      }

      let state = stateInit(id) as S
      let currentVersion = 0

      const snapshot = await toAsyncResult(() => deps.eventStore.getSnapshot(id))
      if (!snapshot.ok) {
        return err({
          code: 'SNAPSHOT_CANNOT_BE_LOADED',
          message: 'Snapshot cannot be loaded',
          cause: snapshot.error
        })
      }
      if (snapshot.value && snapshot.value !== null) {
        state = snapshot.value.state as S
        currentVersion = snapshot.value.version
      }

      const events = await toAsyncResult(() => deps.eventStore.getEvents(id, currentVersion + 1))
      if (!events.ok) {
        return err({
          code: 'EVENTS_CANNOT_BE_LOADED',
          message: 'Events cannot be loaded',
          cause: events.error
        })
      }
      currentVersion += events.value.length

      if (currentVersion === 0) {
        return err({
          code: 'NO_EVENTS_STORED',
          message: 'No events stored'
        })
      }

      const nextState = events.value.reduce<S>((currentState, event) => {
        return reducer(currentState, event.event as E)
      }, state)

      return ok({
        state: nextState,
        version: currentVersion
      })
    }
  }
}
