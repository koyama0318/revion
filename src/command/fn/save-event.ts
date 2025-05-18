import type {
  AppError,
  AsyncResult,
  DomainEvent,
  ExtendedDomainEvent,
  ExtendedState,
  Snapshot,
  State
} from '../../types'
import { err, ok } from '../../utils'
import type { CommandHandlerDeps } from '../command-handler'

export const SNAPSHOT_INTERVAL = 100

export type SaveEventFn<S extends State, E extends DomainEvent> = (
  state: ExtendedState<S>,
  events: ExtendedDomainEvent<E>[]
) => AsyncResult<void, AppError>

export function createSaveEventFnFactory<
  S extends State,
  E extends DomainEvent,
  D extends CommandHandlerDeps
>(): (deps: D) => SaveEventFn<S, E> {
  return (deps: D) => {
    return async (state: ExtendedState<S>, events: ExtendedDomainEvent<E>[]) => {
      const sortedEvents = events.sort((a, b) => a.version - b.version)

      const versionSet = new Set(sortedEvents.map(e => e.version))
      if (versionSet.size !== sortedEvents.length) {
        return err({
          code: 'VERSION_DUPLICATION',
          message: 'Version duplication'
        })
      }

      const firstEvent = sortedEvents[0]
      if (!firstEvent) {
        return err({
          code: 'NO_EVENTS_GENERATED',
          message: 'No events generated'
        })
      }

      const gotVersion = await deps.eventStore.getLastEventVersion(state.state.id)
      if (!gotVersion.ok) {
        return err({
          code: 'LAST_EVENT_VERSION_CANNOT_BE_LOADED',
          message: 'Last event version cannot be loaded',
          cause: gotVersion.error
        })
      }

      if (gotVersion.value + 1 !== firstEvent.version) {
        return err({
          code: 'CONFLICT',
          message: `Event version mismatch: expected: ${gotVersion.value + 1}, received: ${firstEvent.version}`
        })
      }

      if (state.version >= SNAPSHOT_INTERVAL) {
        const snapshot: Snapshot<S> = {
          state: state.state,
          version: state.version,
          timestamp: new Date()
        }

        const savedSnapshot = await deps.eventStore.saveSnapshot(snapshot)
        if (!savedSnapshot.ok) {
          return err({
            code: 'SNAPSHOT_CANNOT_BE_SAVED',
            message: 'Snapshot cannot be saved',
            cause: savedSnapshot.error
          })
        }
      }

      const savedEvents = await deps.eventStore.saveEvents(events)
      if (!savedEvents.ok) {
        return err({
          code: 'EVENTS_CANNOT_BE_SAVED',
          message: 'Events cannot be saved',
          cause: savedEvents.error
        })
      }

      return ok(undefined)
    }
  }
}
