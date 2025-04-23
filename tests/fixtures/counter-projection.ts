import { EventBus } from '../../src/event/event-bus'
import { createEventHandler } from '../../src/event/event-handler'
import type { AppError } from '../../src/types/error'
import type { EventHandlerFactory } from '../../src/types/event'
import { parseAggregateId } from '../../src/types/id'
import type { ReadStorage } from '../../src/types/read-storage'
import { ReadStorageInMemory } from '../../src/utils/read-storage-in-memory'
import type { AsyncResult } from '../../src/utils/result'
import type { CounterEvent } from './counter-command'

type CounterView = {
  type: 'Counter'
  id: string
  count: number
}

export function setupProjectionFactory(): EventHandlerFactory {
  const projection = async (storage: ReadStorage, event: CounterEvent): AsyncResult<void, AppError> => {
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

  return createEventHandler<CounterEvent>(projection)
}

const readStorage = new ReadStorageInMemory()
const factory = setupProjectionFactory()
const handler = factory(readStorage)
export const eventBus = new EventBus({ counter: handler })
