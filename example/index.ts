import { type Result, err, ok } from 'neverthrow'
import { ResultAsync } from 'neverthrow'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

// --- Library Imports (Using direct path for development) ---
import {
  type AggregateId,
  type AggregateType,
  type AppError,
  type AuthorizationPolicy,
  type Command,
  type DomainEvent,
  type DomainEventPayload,
  type EventDecider,
  type EventStore,
  type GetUserContextFn,
  type IdempotencyStore,
  InMemoryIdempotencyStore,
  type MiddlewareFn,
  type Reducer,
  RoleBasedPolicy,
  type Snapshot,
  type State,
  TTLIdempotencyStore,
  type UserContext,
  createAuthorizationMiddleware,
  createCommandBus,
  createCommandHandler,
  createIdempotencyMiddleware,
  createSchemaValidator,
  createValidationMiddleware,
  errAsync,
  loggingMiddleware,
  okAsync
} from '../packages/revion-core/src' // パスを src/index.ts に戻す

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
  commandId: string
  operation: 'increment'
  aggregateType: typeof COUNTER_AGGREGATE_TYPE
  payload: {
    amount: number
  }
}
interface DecrementCommand extends Command {
  // Command は aggregateId を含むはず
  commandId: string
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
const counterReducer: Reducer<CounterState, CounterEventPayload> = (
  state,
  event
): CounterState => {
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

// Mock EventStore Implementation adapted to match new interface
class MockEventStore implements EventStore<CounterState, CounterEventPayload> {
  private events: DomainEvent<CounterEventPayload>[] = []
  private snapshots = new Map<string, Snapshot<CounterState>>()

  async loadHistory(
    aggregateType: AggregateType,
    aggregateId: AggregateId,
    fromVersion?: number
  ): Promise<Result<DomainEvent<CounterEventPayload>[], AppError>> {
    console.log(
      `[EventStore] Loading history for ${aggregateType}/${aggregateId} from version ${fromVersion ?? 0}`
    )
    const filteredEvents = this.events
      .filter(
        e =>
          e.aggregateType === aggregateType &&
          e.aggregateId === aggregateId &&
          e.version > (fromVersion ?? 0)
      )
      .sort((a, b) => a.version - b.version)

    return ok(filteredEvents)
  }

  async save(
    aggregateType: AggregateType,
    aggregateId: AggregateId,
    events: DomainEvent<CounterEventPayload>[]
  ): Promise<Result<void, AppError>> {
    console.log(
      `[EventStore] Saving ${events.length} events for ${aggregateType}/${aggregateId}`
    )
    this.events.push(...events)
    return ok(undefined)
  }

  async loadSnapshot(
    aggregateType: AggregateType,
    aggregateId: AggregateId
  ): Promise<Result<Snapshot<CounterState> | undefined, AppError>> {
    const key = `${aggregateType}-${aggregateId}`
    console.log(`[EventStore] Loading snapshot for ${key}`)
    const snapshot = this.snapshots.get(key)
    return ok(snapshot)
  }

  async saveSnapshot(
    aggregateType: AggregateType,
    aggregateId: AggregateId,
    snapshot: Snapshot<CounterState>
  ): Promise<Result<void, AppError>> {
    const key = `${aggregateType}-${aggregateId}`
    console.log(
      `[EventStore] Saving snapshot for ${key} at version ${snapshot.version}`
    )
    this.snapshots.set(key, snapshot)
    return ok(undefined)
  }

  /** Debugging method to view stored events. */
  public getEventsForDebug(): DomainEvent<CounterEventPayload>[] {
    return this.events
  }
}

// --- 3. Setup Validations ---
// Zod schema for the increment command payload
const incrementPayloadSchema = z.object({
  amount: z.number().positive('Amount must be positive')
})

// Zod schema for the decrement command payload
const decrementPayloadSchema = z.object({
  amount: z.number().positive('Amount must be positive')
})

// Create validation rules
const incrementValidator = createSchemaValidator(incrementPayloadSchema)
const decrementValidator = createSchemaValidator(decrementPayloadSchema)

// --- 4. Setup Authorization ---
// Define role-based permissions
const permissionsConfig = {
  admin: ['*'], // Admin can do everything
  operator: [
    `${COUNTER_AGGREGATE_TYPE}:increment`,
    `${COUNTER_AGGREGATE_TYPE}:decrement`
  ], // Operators can increment and decrement
  reader: [] // Readers have no command permissions
}

// Create authorization policy
const authPolicy = new RoleBasedPolicy(permissionsConfig)

// Mock user context provider (in real app, this would get user from session/token)
const getUserContext: GetUserContextFn = () => {
  // For this example, we'll use a fixed admin user
  const adminUser: UserContext = {
    userId: 'admin-user-1',
    roles: ['admin'],
    attributes: { name: 'Admin User' }
  }

  return ResultAsync.fromPromise(
    Promise.resolve(adminUser),
    (error): AppError => ({
      type: 'InternalServerError',
      message: 'Failed to get user context',
      cause: error
    })
  )
}

// --- 5. Setup Idempotency ---
// Create an idempotency store with TTL
const idempotencyStore: IdempotencyStore = new TTLIdempotencyStore(
  60 * 60 * 1000
) // 1 hour TTL

// --- 6. Setup Command Handler ---
const eventStore = new MockEventStore()

const handleCounterCommand = createCommandHandler<
  CounterState,
  CounterCommand,
  CounterEventPayload
>(counterDecider, counterReducer, createInitialCounterState, eventStore)

// --- 7. Setup Command Bus with Middlewares ---
// Create validation middleware based on command type
const validationMiddleware: MiddlewareFn = (command, next) => {
  if (command.aggregateType === COUNTER_AGGREGATE_TYPE) {
    if (command.operation === 'increment') {
      return createValidationMiddleware([incrementValidator])(command, next)
    }
    if (command.operation === 'decrement') {
      return createValidationMiddleware([decrementValidator])(command, next)
    }
  }
  return next(command)
}

// Create the command bus with all middlewares
const commandBus = createCommandBus([
  loggingMiddleware,
  createAuthorizationMiddleware(authPolicy, getUserContext),
  createIdempotencyMiddleware(idempotencyStore),
  validationMiddleware
])

// --- 8. Register Handler ---
commandBus.register(COUNTER_AGGREGATE_TYPE, handleCounterCommand)

// --- 9. Dispatch Commands ---
async function runExample() {
  const counterId: AggregateId = uuidv4()

  console.log('\n--- Dispatching Increment ---')
  const incrementCommand: IncrementCommand = {
    commandId: uuidv4(),
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

  console.log('\n--- Testing Idempotency (Duplicate Command) ---')
  // Try to dispatch the same command again - should be rejected due to idempotency check
  const duplicateIncResult = await commandBus.dispatch(incrementCommand)
  if (duplicateIncResult.isErr()) {
    console.log(
      'Duplicate command rejected as expected:',
      duplicateIncResult.error.type
    )
  } else {
    console.error('Error: Duplicate command was accepted!')
  }

  console.log('\n--- Dispatching Decrement (Success) ---')
  const decrementCommand1: DecrementCommand = {
    commandId: uuidv4(),
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

  console.log('\n--- Testing Validation (Invalid Amount) ---')
  // Try with invalid payload (negative amount) - should fail validation
  const invalidCommand: IncrementCommand = {
    commandId: uuidv4(),
    operation: 'increment',
    aggregateType: COUNTER_AGGREGATE_TYPE,
    aggregateId: counterId,
    payload: { amount: -5 }
  }
  const invalidResult = await commandBus.dispatch(invalidCommand)
  if (invalidResult.isErr()) {
    console.log(
      'Invalid command rejected as expected:',
      invalidResult.error.type
    )
  } else {
    console.error('Error: Invalid command was accepted!')
  }

  console.log('\n--- Dispatching Decrement (Failure - Exceeds count) ---')
  const decrementCommand2: DecrementCommand = {
    commandId: uuidv4(),
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

// Run the example
runExample().catch(error => {
  console.error('Example failed with error:', error)
})
