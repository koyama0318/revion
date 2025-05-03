import { createCommandHandler } from '../../../src/command/command-factory'
import { err, ok } from '../../../src/utils/result'
import type { CounterCommand, CounterEvent, CounterId, CounterState } from './types'

const initState = (id: CounterId): CounterState => ({
  aggregateId: id,
  count: 0
})

const decider = (state: CounterState, command: CounterCommand) => {
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

export const { handler, replayer } = createCommandHandler({
  aggregateType: 'counter',
  initState,
  decider,
  reducer
})
