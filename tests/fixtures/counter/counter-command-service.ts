import type { DomainServiceEventDeciderFactory } from '../../../src/types/command-service'
import type { EventStore } from '../../../src/types/event-store'
import {} from '../../../src/types/id'
import { err, ok } from '../../../src/utils/result'
import type { CounterServiceCommand, CounterState } from './types'

interface CounterRepository {
  getCount(): Promise<number>
}

interface CounterDependency {
  eventStore: EventStore
  repo: CounterRepository
}

class CounterService {
  constructor(private readonly repo: CounterRepository) {}

  async calculate(value: number, add: number): Promise<number> {
    const gotCount = await this.repo.getCount()
    return (value + add) * 2 + gotCount
  }
}

export const serviceFactory: DomainServiceEventDeciderFactory<CounterDependency> = deps => {
  const service = new CounterService(deps.repo)

  return async (cmd, replay) => {
    const command = cmd as CounterServiceCommand
    switch (command.operation) {
      case 'calculate': {
        const counterResult = await replay(command.payload.counterId)
        if (!counterResult.ok) {
          return counterResult
        }

        const counter = counterResult.value as CounterState
        const got = await service.calculate(counter.count, command.payload.amount)
        const newCount = counter.count - got

        return ok([
          {
            aggregateId: command.aggregateId,
            eventType: 'increment',
            version: 1,
            timestamp: new Date(),
            payload: {
              amount: newCount
            }
          }
        ])
      }

      default:
        return err({
          message: 'Unknown command',
          code: 'UNKNOWN_COMMAND'
        })
    }
  }
}
