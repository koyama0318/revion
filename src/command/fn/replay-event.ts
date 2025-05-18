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
import { err, ok } from '../../utils'
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
      if (id.id === '00000000-0000-0000-0000-000000000000') {
        const uuid = v4()
        return ok({
          state: stateInit({ type: id.type, id: uuid }) as S,
          version: 0
        })
      }

      let state = stateInit(id) as S
      let currentVersion = 0

      const snapshotResult = await deps.eventStore.getSnapshot(id)
      if (!snapshotResult.ok) {
        return err({
          code: 'SNAPSHOT_CANNOT_BE_LOADED',
          message: 'Snapshot cannot be loaded',
          cause: snapshotResult.error
        })
      }
      if (snapshotResult.value && snapshotResult.value !== null) {
        state = snapshotResult.value.state as S
        currentVersion = snapshotResult.value.version
      }

      const events = await deps.eventStore.getEvents(id, currentVersion + 1)
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
