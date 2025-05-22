import type { CounterId } from '../counter'

export type MergeCounterCommand = {
  operation: 'mergeCounter'
  id: { type: 'mergeCounter'; id: string }
  payload: {
    fromCounterId: CounterId
    toCounterId: CounterId
  }
}
