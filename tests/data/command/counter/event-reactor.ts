import type { Policy, Projection } from '../../../../src'
import { createEventReactor } from '../../../../src'
import type { ViewMap } from '../../query/view'
import type { CounterCommand, CounterEvent, CounterId } from './types'

const policy: Policy<CounterCommand, CounterEvent> = {
  created: event => {
    const command: CounterCommand = {
      operation: 'increment',
      id: event.aggregateId as CounterId
    }
    return command
  }
}

const projection: Projection<CounterEvent, ViewMap> = {
  created: {
    counter: {
      init: e => ({
        count: 0,
        type: 'counter',
        id: e.aggregateId.id
      })
    }
  },
  incremented: {
    counter: {
      id: e => e.aggregateId.id,
      apply: (_e, view) => {
        view.count += 1
      }
    }
  },
  decremented: {
    counter: {
      id: e => e.aggregateId.id,
      apply: (_e, view) => {
        view.count -= 1
      }
    }
  },
  deleted: {
    counter: {
      deleteId: e => e.aggregateId.id
    }
  }
}

export const counterReactor = createEventReactor<'counter', CounterCommand, CounterEvent, ViewMap>({
  type: 'counter',
  policy,
  projection
})
