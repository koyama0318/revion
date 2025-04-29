import type { DomainEvent, Reducer, State } from "../types/command"
import type { AppError } from "../types/error"
import type { EventStore } from "../types/event-store"
import type { AggregateId } from "../types/id"
import type { AsyncResult } from "../utils/result"
import { err, ok, toResult } from "../utils/result"

export async function replayState<S extends State, E extends DomainEvent>({
    aggregateId,
    initState,
    reducer,
    eventStore
  }: {
    aggregateId: AggregateId,
    initState: (id: AggregateId) => S,
    reducer: Reducer<S, E>,
    eventStore: EventStore
  }): AsyncResult<S, AppError> {
    let state = initState(aggregateId) as S
    let currentVersion = 0
  
    const snapshot = await toResult(() => eventStore.getSnapshot(aggregateId))
    if (!snapshot.ok) {
      return err({
          code: 'SNAPSHOT_CANNOT_BE_LOADED',
          message: 'Snapshot cannot be loaded',
          cause: snapshot.error
        })
      }
      if (snapshot.value && snapshot.value !== null) {
        const data = snapshot.value.data as S
        if (!('aggregateId' in data && 'version' in data)) {
          return err({
            code: 'INVALID_SNAPSHOT_DATA',
            message: 'Snapshot data does not satisfy State interface'
          })
        }
  
        state = data
        currentVersion = snapshot.value.version
      }
  
      const events = await toResult(() => eventStore.getEvents(aggregateId, currentVersion))
      if (!events.ok) {
        return err({
          code: 'EVENTS_CANNOT_BE_LOADED',
          message: 'Events cannot be loaded',
          cause: events.error
        })
      }
  
      const nextState = events.value.reduce<S>((currentState, event) => {
        return reducer(currentState, event as E)
      }, state)
  
      return ok(nextState)
    } 