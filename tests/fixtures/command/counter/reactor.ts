import type { PolicyFn, ProjectionFn } from '../../../../src'
import { createEventReactor } from '../../../../src'
import type { ViewMap } from '../../view'
import type { CounterCommand, CounterEvent, CounterId } from './types'

const policy: PolicyFn<CounterCommand, CounterEvent> = {
  created: event => {
    const command: CounterCommand = {
      operation: 'increment',
      id: event.aggregateId as CounterId
    }
    return command
  }
}

const projection: ProjectionFn<CounterEvent, ViewMap> = {
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
