import { createEventHandler } from '../../../src/event/event-handler'
import type { AppError } from '../../../src/types/error'
import { parseAggregateId } from '../../../src/types/id'
import type { ReadStorage } from '../../../src/types/read-storage'
import type { AsyncResult } from '../../../src/utils/result'
import type { CounterEvent, CounterView } from './types'

const projection = async (
  storage: ReadStorage,
  event: CounterEvent
): AsyncResult<void, AppError> => {
  const idResult = parseAggregateId(event.aggregateId)
  if (!idResult.ok) {
    return idResult
  }

  const { type, uuid } = idResult.value
  switch (event.eventType) {
    case 'created': {
      return storage.save({
        type,
        id: uuid,
        count: event.payload.amount
      })
    }
    case 'increment': {
      const prev = await storage.getById<CounterView>(type, uuid)
      if (!prev.ok) {
        return prev
      }
      return storage.save({
        ...prev.value,
        count: prev.value.count + event.payload.amount
      })
    }
    case 'decrement': {
      const prev = await storage.getById<CounterView>(type, uuid)
      if (!prev.ok) {
        return prev
      }
      return storage.save({
        ...prev.value,
        count: prev.value.count - event.payload.amount
      })
    }
  }
}

export const eventHandler = createEventHandler<CounterEvent>(projection)
