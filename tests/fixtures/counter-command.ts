import { CommandBus } from '../../src/command/command-bus'
import { createLiteCommandHandler } from '../../src/command/command-handler'
import type { CommandHandlerFactory } from '../../src/types/command'
import type { AggregateId, Id } from '../../src/types/id'
import { EventStoreInMemory } from '../../src/utils/event-store-in-memory'
import { err, ok } from '../../src/utils/result'

type CounterState = {
  aggregateId: Id<'Counter'>
  count: number
}

type CounterCommand = {
  aggregateId: Id<'Counter'>
  operation: 'increment' | 'decrement' | 'noEvent'
  payload: {
    amount: number
  }
}

export type CounterEvent = {
  aggregateId: Id<'Counter'>
  eventType: 'created' | 'increment' | 'decrement'
  payload: {
    amount: number
  }
}

export function setupCommandHandlerFactory(): CommandHandlerFactory {
  const initState = (id: AggregateId): CounterState => ({
    aggregateId: id as Id<'Counter'>,
    count: 0
  })

  const eventDecider = (state: CounterState, command: CounterCommand) => {
    switch (command.operation) {
      case 'increment':
        if (state.count === 0) {
          return ok([
            {
              aggregateId: command.aggregateId,
              eventType: 'created' as const,
              payload: { amount: command.payload.amount }
            }
          ])
        }
        return ok([
          {
            aggregateId: command.aggregateId,
            eventType: 'increment' as const,
            payload: { amount: command.payload.amount }
          }
        ])
      case 'decrement':
        return ok([
          {
            aggregateId: command.aggregateId,
            eventType: 'decrement' as const,
            payload: { amount: command.payload.amount }
          }
        ])
      case 'noEvent':
        return ok([])
      default:
        return err({
          code: 'INVALID_EVENT_DECISION',
          message: 'Invalid event decision'
        })
    }
  }

  const reducer = (state: CounterState, event: CounterEvent): CounterState => {
    switch (event.eventType) {
      case 'created':
        return {
          ...state,
          count: event.payload.amount
        }
      case 'increment':
        return {
          ...state,
          count: state.count + event.payload.amount
        }
      case 'decrement':
        return {
          ...state,
          count: state.count - event.payload.amount
        }
    }
  }

  return createLiteCommandHandler<CounterState, CounterCommand, CounterEvent>(
    initState,
    eventDecider,
    reducer
  )
}

const eventStore = new EventStoreInMemory()
const factory = setupCommandHandlerFactory()
const handler = factory(eventStore)
export const commandBus = new CommandBus({ counter: handler }, [])
