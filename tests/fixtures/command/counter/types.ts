import type { AggregateId } from '../../../../src/types'

export type CounterId = AggregateId<'counter'>

export type CounterState = {
  id: CounterId
  count: number
}

export type CounterCommand = {
  operation: 'create' | 'increment' | 'decrement' | 'delete'
  id: CounterId
}

export type CounterEvent = {
  type: 'created' | 'incremented' | 'decremented' | 'deleted'
}
