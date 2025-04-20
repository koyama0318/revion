import { createLiteCommandHandler } from '../../src/command/command-handler'
import type { CommandHandlerFactory } from '../../src/types/command-bus'
import type { AggregateId, Id } from '../../src/types/id'
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

type CounterEvent = {
  aggregateId: Id<'Counter'>
  eventType: 'increment' | 'decrement'
  payload: {
    amount: number
  }
}

export function setupLiteHandlerFactory(): CommandHandlerFactory {
  const initState = (id: AggregateId): CounterState => ({
    aggregateId: id as Id<'Counter'>,
    count: 0
  })

  const eventDecider = (state: CounterState, command: CounterCommand) => {
    switch (command.operation) {
      case 'increment':
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
