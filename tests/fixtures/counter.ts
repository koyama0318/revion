import { createCommandHandler } from '../../src/command/command-handler'
import type { CommandHandlerFactory } from '../../src/types/command-bus'
import type { AggregateId, Id } from '../../src/types/id'
import { err, ok } from '../../src/utils/result'

type CounterState = {
  aggregateId: Id<'Counter'>
  version: number
  count: number
}

type CounterCommand = {
  aggregateId: Id<'Counter'>
  operation: 'increment' | 'decrement' | 'noEvent'
  payload: {
    amount: number
  }
}

type CounterEvent = {
  aggregateId: Id<'Counter'>
  eventType: 'increment' | 'decrement'
  version: number
  timestamp: Date
  payload: {
    amount: number
  }
}

export function setupHandlerFactory(): CommandHandlerFactory {
  const initState = (id: AggregateId): CounterState => ({
    aggregateId: id as Id<'Counter'>,
    version: 0,
    count: 0
  })

  const eventDecider = (state: CounterState, command: CounterCommand) => {
    switch (command.operation) {
      case 'increment':
        return ok([
          {
            aggregateId: command.aggregateId,
            eventType: 'increment' as const,
            version: state.version + 1,
            timestamp: new Date(),
            payload: { amount: command.payload.amount }
          }
        ])
      case 'decrement':
        return ok([
          {
            aggregateId: command.aggregateId,
            eventType: 'decrement' as const,
            version: state.version + 1,
            timestamp: new Date(),
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
      case 'increment':
        return {
          ...state,
          version: event.version,
          count: state.count + event.payload.amount
        }
      case 'decrement':
        return {
          ...state,
          version: event.version,
          count: state.count - event.payload.amount
        }
    }
  }

  return createCommandHandler<CounterState, CounterCommand, CounterEvent>(initState, eventDecider, reducer)
}
