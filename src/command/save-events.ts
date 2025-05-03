import type { DomainEvent, State } from '../types/command'
import type { AppError } from '../types/error'
import type { EventStore } from '../types/event-store'
import type { AsyncResult } from '../utils/result'
import { err, ok, toResult } from '../utils/result'
import { SNAPSHOT_INTERVAL } from './command-handler'

export async function saveEvents<E extends DomainEvent, S extends State>({
  events,
  state,
  eventStore
}: {
  events: E[]
  state: S
  eventStore: EventStore
}): AsyncResult<void, AppError> {
  const gotVersion = await toResult(() => eventStore.getLastEventVersion(state.aggregateId))
  if (!gotVersion.ok) {
    return err({
      code: 'LAST_EVENT_VERSION_CANNOT_BE_LOADED',
      message: 'Last event version cannot be loaded',
      cause: gotVersion.error
    })
  }

  const firstEvent = events[0]
  if (!firstEvent) {
    return err({
      code: 'NO_EVENTS_GENERATED',
      message: 'No events generated'
    })
  }
  if (gotVersion.value + 1 !== firstEvent.version) {
    return err({
      code: 'CONFLICT',
      message: `Event version mismatch: expected: ${gotVersion.value + 1}, received: ${firstEvent.version}`
    })
  }

  if (state.version >= SNAPSHOT_INTERVAL) {
    const snapshot = {
      aggregateId: state.aggregateId,
      version: state.version,
      timestamp: new Date(),
      data: state
    }

    const savedSnapshot = await toResult(() => eventStore.saveSnapshot(snapshot))
    if (!savedSnapshot.ok) {
      return err({
        code: 'SNAPSHOT_CANNOT_BE_SAVED',
        message: 'Snapshot cannot be saved',
        cause: savedSnapshot.error
      })
    }
  }

  const savedEvents = await toResult(() => eventStore.saveEvents(events))
  if (!savedEvents.ok) {
    return err({
      code: 'EVENTS_CANNOT_BE_SAVED',
      message: 'Events cannot be saved',
      cause: savedEvents.error
    })
  }

  return ok(undefined)
}
