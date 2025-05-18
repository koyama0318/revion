import type { DomainServiceFn, StateCommandPair } from '../../../../src'
import { applyAndSave, createDomainService } from '../../../../src'
import type { CounterCommand, CounterEvent, CounterState } from '../counter'
import type { MergeCounterCommand } from './types'

const service: DomainServiceFn<MergeCounterCommand> = async (command, combined) => {
  const { fromCounterId, toCounterId } = command.payload

  const fromCounter = await combined.replayFn<CounterState>(fromCounterId)
  const toCounter = await combined.replayFn<CounterState>(toCounterId)
  if (!fromCounter || !toCounter) {
    throw new Error('Aggregate not found')
  }

  const pairs: StateCommandPair<CounterState, CounterCommand>[] = []
  for (let i = 0; i < fromCounter.state.count; i++) {
    pairs.push(
      {
        state: fromCounter,
        command: {
          operation: 'decrement',
          id: fromCounterId
        }
      },
      {
        state: toCounter,
        command: {
          operation: 'increment',
          id: toCounterId
        }
      }
    )
  }

  pairs.push({
    state: fromCounter,
    command: {
      operation: 'delete',
      id: fromCounterId
    }
  })

  await applyAndSave<CounterState, CounterCommand, CounterEvent>(
    pairs,
    combined.applyFn,
    combined.saveFn
  )
}

export const mergeCounter = createDomainService('mergeCounter', service)
