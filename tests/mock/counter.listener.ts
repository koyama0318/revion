import type { Policy, Projection } from '../../src/types/eventListener'
import type { CounterEvent } from './counter'

const policy: Policy<CounterEvent> = event => {
  switch (event.type) {
    case 'created':
      return {
        type: 'increment',
        id: event.id,
        payload: {}
      }
    case 'added':
      if (event.payload.isMax) {
        return {
          type: 'reset',
          id: event.id,
          payload: {}
        }
      }
      return
    default:
      return
  }
}

const projection: Projection<CounterEvent> = event => {
  console.log(event)
}

export { policy, projection }
