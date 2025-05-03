import type { Id } from '../../../src/types/id'

export type Counter = 'counter'
export type CounterId = Id<Counter>

export type CounterState = {
  aggregateId: CounterId
  count: number
}

export type CounterCommand = {
  aggregateId: CounterId
  operation: 'increment' | 'decrement'
  payload: {
    amount: number
  }
}

export type CounterServiceCommand = {
  aggregateId: Id<'counterService'>
  operation: 'calculate'
  payload: {
    amount: number
    counterId: CounterId
  }
}

export type CounterEvent = {
  aggregateId: CounterId
  eventType: 'created' | 'increment' | 'decrement'
  payload: {
    amount: number
  }
}

export type CounterView = {
  type: 'Counter'
  id: string
  count: number
}

export type CounterListQuery = {
  type: 'counterList'
}

export type CounterListResult = {
  counters: CounterView[]
}

export type CounterByIdQuery = {
  type: 'counterById'
  id: string
}

export type CounterByIdResult = {
  counter: CounterView
}
