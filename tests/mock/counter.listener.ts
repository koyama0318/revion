import type { Projection } from '../../src/types/eventListener'
import type { CounterEvent } from './counter'

const projection: Projection<CounterEvent> = event => {
  console.log(event)
}

export { projection }
