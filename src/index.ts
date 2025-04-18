import { randomUUIDv7 } from 'bun'
import { CommandBus } from './command/command-bus'
import { createCommandHandler } from './command/command-handler'
import type { EventDecider, Reducer } from './types/command-aggregate'
import type { CommandHandler } from './types/command-bus'
import type { AggregateId } from './types/id'
import { createAggregateId, newAggregateId } from './types/id'
import { EventStoreInMemory } from './utils/event-store-in-memory'
import { err, ok } from './utils/result'

// MARK: Example

type AccountState = {
  aggregateId: AggregateId
  version: number
  balance: number
}

type AccountCommand = {
  aggregateId: AggregateId
  operation: 'deposit' | 'withdraw'
  payload: {
    amount: number
  }
}

type AccountEvent = {
  aggregateId: AggregateId
  eventType: string
  version: number
  timestamp: Date
  payload: {
    amount: number
  }
}

const initState: (id: AggregateId) => AccountState = id => ({
  aggregateId: id,
  version: 0,
  balance: 0
})

const eventDecider: EventDecider<AccountState, AccountCommand, AccountEvent> = (state, command) => {
  switch (command.operation) {
    case 'deposit':
      return ok([
        {
          aggregateId: command.aggregateId,
          eventType: 'deposit',
          version: state.version + 1,
          timestamp: new Date(),
          payload: {
            amount: command.payload.amount
          }
        }
      ])
    case 'withdraw':
      return ok([
        {
          aggregateId: command.aggregateId,
          eventType: 'withdraw',
          version: state.version + 1,
          timestamp: new Date(),
          payload: {
            amount: command.payload.amount
          }
        }
      ])
    default:
      return err({
        code: 'INVALID_OPERATION',
        message: `Invalid operation: ${command.operation}`
      })
  }
}

const reducer: Reducer<AccountState, AccountEvent> = (state, event) => {
  switch (event.eventType) {
    case 'deposit':
      return {
        ...state,
        version: event.version,
        balance: state.balance + event.payload.amount
      }
    case 'withdraw':
      return {
        ...state,
        version: event.version,
        balance: state.balance - event.payload.amount
      }
    default:
      return state
  }
}

const factory = createCommandHandler(initState, eventDecider, reducer)

const eventStore = new EventStoreInMemory()

const handlers: Record<string, CommandHandler> = {
  Account: factory(eventStore)
}

const commandBus = new CommandBus(handlers, [])

const id = newAggregateId('Account')
const commandList = [
  {
    aggregateId: id,
    operation: 'deposit',
    version: 0,
    payload: { amount: 100 }
  },
  {
    aggregateId: id,
    operation: 'deposit',
    version: 1,
    payload: { amount: 1000 }
  },
  {
    aggregateId: id,
    operation: 'withdraw',
    version: 2,
    payload: { amount: 500 }
  }
]

for (const command of commandList) {
  const result = await commandBus.dispatch(command)
  if (!result.ok) {
    console.error(result.error)
  }
}

console.log('events', eventStore.events)
console.log('snapshots', eventStore.snapshots)
