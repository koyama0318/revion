import type { CaseProjections } from '../../src/types/eventListener'
import type { CounterEvent } from './counter'

const projection: CaseProjections<CounterEvent> = {
  created: () => {},
  added: () => {},
  subtracted: () => {},
  reseted: () => {}
}

export { projection }
