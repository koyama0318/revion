import { type Result, err, ok } from 'neverthrow'
import { v4 as uuidv4 } from 'uuid'

// --- Library Imports (Using direct path for development) ---
import {
  type AggregateId,
  type AggregateType,
  type AppError,
  type Command,
  type DomainEvent,
  type DomainEventPayload,
  type EventDecider,
  type EventStore,
  type MiddlewareFn,
  type Reducer,
  type Snapshot,
  type State,
  createCommandBus,
  createCommandHandler,
  loggingMiddleware
} from '../src' // パスを src/index.ts に戻す

// --- 1. Counter Aggregate Definition ---

const COUNTER_AGGREGATE_TYPE = 'counter'

// State
interface CounterState extends State {
  // State は aggregateId を含むはず
  aggregateType: typeof COUNTER_AGGREGATE_TYPE
  count: number
}

// Initial State Creator
const createInitialCounterState = (
  type: AggregateType,
  id: AggregateId
): CounterState => {
  return {
    aggregateType: type as typeof COUNTER_AGGREGATE_TYPE,
    aggregateId: id, // ここで設定される
    count: 0
  }
}

// Commands
interface IncrementCommand extends Command {
  // Command は aggregateId を含むはず
  operation: 'increment'
  aggregateType: typeof COUNTER_AGGREGATE_TYPE
  payload: {
    amount: number
  }
}
interface DecrementCommand extends Command {
  // Command は aggregateId を含むはず
  operation: 'decrement'
  aggregateType: typeof COUNTER_AGGREGATE_TYPE
  payload: {
    amount: number
  }
}
type CounterCommand = IncrementCommand | DecrementCommand

// Event Payloads
interface CounterIncrementedPayload extends DomainEventPayload {
  eventType: 'CounterIncremented'
  amount: number
}
interface CounterDecrementedPayload extends DomainEventPayload {
  eventType: 'CounterDecremented'
  amount: number
}
type CounterEventPayload = CounterIncrementedPayload | CounterDecrementedPayload

// Decider
const counterDecider: EventDecider<
  CounterState,
  CounterCommand,
  CounterEventPayload
> = (state, command): Result<CounterEventPayload[], AppError> => {
  switch (command.operation) {
    case 'increment': {
      if (command.payload.amount <= 0) {
        return err({
          type: 'ValidationError',
          message: 'Increment amount must be positive'
        })
      }
      const payload: CounterIncrementedPayload = {
        eventType: 'CounterIncremented',
        amount: command.payload.amount
      }
      return ok([payload])
    }
    case 'decrement': {
      if (command.payload.amount <= 0) {
        return err({
          type: 'ValidationError',
          message: 'Decrement amount must be positive'
        })
      }
      if (state.count < command.payload.amount) {
        return err({
          type: 'ValidationError',
          message: 'Decrement amount exceeds current count',
          details: { currentCount: state.count, amount: command.payload.amount }
        })
      }
      const payload: CounterDecrementedPayload = {
        eventType: 'CounterDecremented',
        amount: command.payload.amount
      }
      return ok([payload])
    }
    default:
      return err({
        type: 'ValidationError',
        message: 'Unknown command operation'
      })
  }
}

// Reducer
const counterReducer: Reducer<CounterState> = (state, event): CounterState => {
  switch (event.payload.eventType) {
    case 'CounterIncremented': {
      const incPayload = event.payload as CounterIncrementedPayload
      return { ...state, count: state.count + incPayload.amount }
    }
    case 'CounterDecremented': {
      const decPayload = event.payload as CounterDecrementedPayload
      return { ...state, count: state.count - decPayload.amount }
    }
    default:
      return state
  }
}

// --- 2. In-Memory Event Store Implementation ---

class InMemoryEventStore implements EventStore {
  private events: DomainEvent<DomainEventPayload>[] = []
  private snapshots = new Map<string, Snapshot<State>>()

  async loadHistory(
    aggregateType: string,
    fromVersion?: number | undefined
  ): Promise<DomainEvent<DomainEventPayload>[]> {
    console.log(
      `[EventStore] Loading history for ${aggregateType} from version ${fromVersion ?? 0}`
    )
    return this.events
      .filter(
        e => e.aggregateType === aggregateType && e.version > (fromVersion ?? 0)
      )
      .sort((a, b) => a.version - b.version)
  }

  async save(newEvents: DomainEvent<DomainEventPayload>[]): Promise<void> {
    console.log(`[EventStore] Saving ${newEvents.length} events`)
    this.events.push(...newEvents)
  }

  async loadSnapshot<S extends State>(
    aggregateType: string
  ): Promise<Snapshot<S> | undefined> {
    console.log(`[EventStore] Loading snapshot for ${aggregateType}`)
    const snapshot = this.snapshots.get(aggregateType)
    return snapshot as Snapshot<S> | undefined
  }

  async saveSnapshot<S extends State>(snapshot: Snapshot<S>): Promise<void> {
    console.log(
      `[EventStore] Saving snapshot for ${snapshot.aggregateType} at version ${snapshot.version}`
    )
    this.snapshots.set(snapshot.aggregateType, snapshot)
  }

  /** Debugging method to view stored events. */
  public getEventsForDebug(): DomainEvent<DomainEventPayload>[] {
    return this.events
  }
}

// --- 3. Setup Command Handler ---
const eventStore = new InMemoryEventStore()

const handleCounterCommand = createCommandHandler<
  CounterState,
  CounterCommand,
  CounterEventPayload
>(counterDecider, counterReducer, createInitialCounterState, eventStore)

// --- 4. Setup Command Bus with Middleware ---
const commandBus = createCommandBus([loggingMiddleware])

// --- 5. Register Handler ---
commandBus.register(COUNTER_AGGREGATE_TYPE, handleCounterCommand)

// --- 6. Dispatch Commands ---
async function runExample() {
  const counterId: AggregateId = uuidv4()

  console.log('\n--- Dispatching Increment ---')
  const incrementCommand: IncrementCommand = {
    operation: 'increment',
    aggregateType: COUNTER_AGGREGATE_TYPE,
    aggregateId: counterId,
    payload: { amount: 10 }
  }
  const incResult1 = await commandBus.dispatch(incrementCommand)
  if (incResult1.isErr()) {
    console.error('Increment failed:', incResult1.error)
  } else {
    console.log('Increment 1 successful.')
  }

  console.log('\n--- Dispatching Decrement (Success) ---')
  const decrementCommand1: DecrementCommand = {
    operation: 'decrement',
    aggregateType: COUNTER_AGGREGATE_TYPE,
    aggregateId: counterId,
    payload: { amount: 3 }
  }
  const decResult1 = await commandBus.dispatch(decrementCommand1)
  if (decResult1.isErr()) {
    console.error('Decrement 1 failed:', decResult1.error)
  } else {
    console.log('Decrement 1 successful.')
  }

  console.log('\n--- Dispatching Decrement (Failure - Exceeds count) ---')
  const decrementCommand2: DecrementCommand = {
    operation: 'decrement',
    aggregateType: COUNTER_AGGREGATE_TYPE,
    aggregateId: counterId,
    payload: { amount: 15 }
  }
  const decResult2 = await commandBus.dispatch(decrementCommand2)
  if (decResult2.isErr()) {
    console.error('Decrement 2 failed as expected:', decResult2.error)
  } else {
    console.log('Decrement 2 succeeded unexpectedly.')
  }

  console.log('\n--- Current Events in Store ---')
  console.log(eventStore.getEventsForDebug())
}

runExample()
