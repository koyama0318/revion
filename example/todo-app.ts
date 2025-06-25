import { type Result, err, ok } from 'neverthrow'
import { ResultAsync } from 'neverthrow'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

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
  type Query,
  type QueryHandler,
  type QueryResult,
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
  createQueryBus,
  createSchemaValidator,
  createValidationMiddleware,
  errAsync,
  loggingMiddleware,
  okAsync
} from '../src'

// --- Todo Aggregate Definition ---

const TODO_AGGREGATE_TYPE = 'todo'

// Todo Status
enum TodoStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed'
}

// State
interface TodoState extends State {
  aggregateType: typeof TODO_AGGREGATE_TYPE
  title: string
  description: string
  status: TodoStatus
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

// Initial State Creator
const createInitialTodoState = (
  type: AggregateType,
  id: AggregateId
): TodoState => {
  const now = new Date()
  return {
    aggregateType: type as typeof TODO_AGGREGATE_TYPE,
    aggregateId: id,
    title: '',
    description: '',
    status: TodoStatus.PENDING,
    createdAt: now,
    updatedAt: now
  }
}

// Commands
interface CreateTodoCommand extends Command {
  commandId: string
  operation: 'create'
  aggregateType: typeof TODO_AGGREGATE_TYPE
  payload: {
    title: string
    description: string
  }
}

interface UpdateTodoCommand extends Command {
  commandId: string
  operation: 'update'
  aggregateType: typeof TODO_AGGREGATE_TYPE
  payload: {
    title?: string
    description?: string
  }
}

interface ChangeStatusCommand extends Command {
  commandId: string
  operation: 'changeStatus'
  aggregateType: typeof TODO_AGGREGATE_TYPE
  payload: {
    status: TodoStatus
  }
}

interface DeleteTodoCommand extends Command {
  commandId: string
  operation: 'delete'
  aggregateType: typeof TODO_AGGREGATE_TYPE
  payload: {}
}

type TodoCommand = CreateTodoCommand | UpdateTodoCommand | ChangeStatusCommand | DeleteTodoCommand

// Event Payloads
interface TodoCreatedPayload extends DomainEventPayload {
  eventType: 'TodoCreated'
  title: string
  description: string
  createdAt: Date
}

interface TodoUpdatedPayload extends DomainEventPayload {
  eventType: 'TodoUpdated'
  title?: string
  description?: string
  updatedAt: Date
}

interface TodoStatusChangedPayload extends DomainEventPayload {
  eventType: 'TodoStatusChanged'
  status: TodoStatus
  updatedAt: Date
  completedAt?: Date
}

interface TodoDeletedPayload extends DomainEventPayload {
  eventType: 'TodoDeleted'
  deletedAt: Date
}

type TodoEventPayload = TodoCreatedPayload | TodoUpdatedPayload | TodoStatusChangedPayload | TodoDeletedPayload

// Decider
const todoDecider: EventDecider<
  TodoState,
  TodoCommand,
  TodoEventPayload
> = (state, command): Result<TodoEventPayload[], AppError> => {
  switch (command.operation) {
    case 'create': {
      if (state.title !== '') {
        return err({
          type: 'ValidationError',
          message: 'Todo already exists'
        })
      }
      if (!command.payload.title.trim()) {
        return err({
          type: 'ValidationError',
          message: 'Title is required'
        })
      }
      const payload: TodoCreatedPayload = {
        eventType: 'TodoCreated',
        title: command.payload.title,
        description: command.payload.description,
        createdAt: new Date()
      }
      return ok([payload])
    }
    case 'update': {
      if (state.title === '') {
        return err({
          type: 'ValidationError',
          message: 'Todo does not exist'
        })
      }
      if (state.status === TodoStatus.COMPLETED) {
        return err({
          type: 'ValidationError',
          message: 'Cannot update completed todo'
        })
      }
      const payload: TodoUpdatedPayload = {
        eventType: 'TodoUpdated',
        title: command.payload.title,
        description: command.payload.description,
        updatedAt: new Date()
      }
      return ok([payload])
    }
    case 'changeStatus': {
      if (state.title === '') {
        return err({
          type: 'ValidationError',
          message: 'Todo does not exist'
        })
      }
      if (state.status === command.payload.status) {
        return err({
          type: 'ValidationError',
          message: 'Status is already set to the requested value'
        })
      }
      const now = new Date()
      const payload: TodoStatusChangedPayload = {
        eventType: 'TodoStatusChanged',
        status: command.payload.status,
        updatedAt: now,
        completedAt: command.payload.status === TodoStatus.COMPLETED ? now : undefined
      }
      return ok([payload])
    }
    case 'delete': {
      if (state.title === '') {
        return err({
          type: 'ValidationError',
          message: 'Todo does not exist'
        })
      }
      const payload: TodoDeletedPayload = {
        eventType: 'TodoDeleted',
        deletedAt: new Date()
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
const todoReducer: Reducer<TodoState, TodoEventPayload> = (
  state,
  event
): TodoState => {
  switch (event.payload.eventType) {
    case 'TodoCreated': {
      const payload = event.payload as TodoCreatedPayload
      return {
        ...state,
        title: payload.title,
        description: payload.description,
        createdAt: payload.createdAt,
        updatedAt: payload.createdAt
      }
    }
    case 'TodoUpdated': {
      const payload = event.payload as TodoUpdatedPayload
      return {
        ...state,
        title: payload.title ?? state.title,
        description: payload.description ?? state.description,
        updatedAt: payload.updatedAt
      }
    }
    case 'TodoStatusChanged': {
      const payload = event.payload as TodoStatusChangedPayload
      return {
        ...state,
        status: payload.status,
        updatedAt: payload.updatedAt,
        completedAt: payload.completedAt
      }
    }
    case 'TodoDeleted': {
      return {
        ...state,
        title: '',
        description: '',
        status: TodoStatus.PENDING
      }
    }
    default:
      return state
  }
}

// Mock EventStore Implementation
class MockTodoEventStore implements EventStore<TodoState, TodoEventPayload> {
  private events: DomainEvent<TodoEventPayload>[] = []
  private snapshots = new Map<string, Snapshot<TodoState>>()

  async loadHistory(
    aggregateType: AggregateType,
    aggregateId: AggregateId,
    fromVersion?: number
  ): Promise<Result<DomainEvent<TodoEventPayload>[], AppError>> {
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
    events: DomainEvent<TodoEventPayload>[]
  ): Promise<Result<void, AppError>> {
    this.events.push(...events)
    return ok(undefined)
  }

  async loadSnapshot(
    aggregateType: AggregateType,
    aggregateId: AggregateId
  ): Promise<Result<Snapshot<TodoState> | undefined, AppError>> {
    const key = `${aggregateType}-${aggregateId}`
    const snapshot = this.snapshots.get(key)
    return ok(snapshot)
  }

  async saveSnapshot(
    aggregateType: AggregateType,
    aggregateId: AggregateId,
    snapshot: Snapshot<TodoState>
  ): Promise<Result<void, AppError>> {
    const key = `${aggregateType}-${aggregateId}`
    this.snapshots.set(key, snapshot)
    return ok(undefined)
  }

  public getEventsForDebug(): DomainEvent<TodoEventPayload>[] {
    return this.events
  }

  public getAllTodos(): TodoState[] {
    const todos: TodoState[] = []
    const aggregateMap = new Map<string, TodoState>()

    // Replay events to build current state
    for (const event of this.events) {
      const key = event.aggregateId
      let currentState = aggregateMap.get(key)
      
      if (!currentState) {
        currentState = createInitialTodoState(event.aggregateType, event.aggregateId)
      }
      
      const newState = todoReducer(currentState, event)
      aggregateMap.set(key, newState)
    }

    // Filter out deleted todos (empty title)
    for (const [_, state] of aggregateMap) {
      if (state.title !== '') {
        todos.push(state)
      }
    }

    return todos
  }
}

// --- Query Handlers ---

interface GetAllTodosQuery extends Query {
  operation: 'getAllTodos'
}

interface GetTodoByIdQuery extends Query {
  operation: 'getTodoById'
  entityId: string
}

interface GetTodosByStatusQuery extends Query {
  operation: 'getTodosByStatus'
  params: { status: TodoStatus }
}

type TodoQuery = GetAllTodosQuery | GetTodoByIdQuery | GetTodosByStatusQuery

const eventStore = new MockTodoEventStore()

const getAllTodosHandler: QueryHandler<TodoState[]> = async (query) => {
  const todos = eventStore.getAllTodos()
  return { data: todos }
}

const getTodoByIdHandler: QueryHandler<TodoState | null> = async (query) => {
  const todos = eventStore.getAllTodos()
  const todo = todos.find(t => t.aggregateId === query.entityId)
  return { data: todo || null }
}

const getTodosByStatusHandler: QueryHandler<TodoState[]> = async (query) => {
  const todos = eventStore.getAllTodos()
  const { status } = query.params as { status: TodoStatus }
  const filteredTodos = todos.filter(t => t.status === status)
  return { data: filteredTodos }
}

// --- Validation Schemas ---
const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long')
})

const updateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long').optional(),
  description: z.string().max(500, 'Description too long').optional()
})

const changeStatusSchema = z.object({
  status: z.nativeEnum(TodoStatus, { errorMap: () => ({ message: 'Invalid status' }) })
})

// Create validators
const createTodoValidator = createSchemaValidator(createTodoSchema)
const updateTodoValidator = createSchemaValidator(updateTodoSchema)
const changeStatusValidator = createSchemaValidator(changeStatusSchema)

// --- Authorization Setup ---
const permissionsConfig = {
  admin: ['*'],
  user: [
    `${TODO_AGGREGATE_TYPE}:create`,
    `${TODO_AGGREGATE_TYPE}:update`,
    `${TODO_AGGREGATE_TYPE}:changeStatus`,
    `${TODO_AGGREGATE_TYPE}:delete`
  ],
  reader: []
}

const authPolicy = new RoleBasedPolicy(permissionsConfig)

const getUserContext: GetUserContextFn = () => {
  const user: UserContext = {
    userId: 'user-1',
    roles: ['user'],
    attributes: { name: 'Todo User' }
  }

  return ResultAsync.fromPromise(
    Promise.resolve(user),
    (error): AppError => ({
      type: 'InternalServerError',
      message: 'Failed to get user context',
      cause: error
    })
  )
}

// --- Setup Command Handler ---
const handleTodoCommand = createCommandHandler<
  TodoState,
  TodoCommand,
  TodoEventPayload
>(todoDecider, todoReducer, createInitialTodoState, eventStore)

// --- Setup Command Bus with Middlewares ---
const validationMiddleware: MiddlewareFn = (command, next) => {
  if (command.aggregateType === TODO_AGGREGATE_TYPE) {
    switch (command.operation) {
      case 'create':
        return createValidationMiddleware([createTodoValidator])(command, next)
      case 'update':
        return createValidationMiddleware([updateTodoValidator])(command, next)
      case 'changeStatus':
        return createValidationMiddleware([changeStatusValidator])(command, next)
    }
  }
  return next(command)
}

const idempotencyStore: IdempotencyStore = new TTLIdempotencyStore(60 * 60 * 1000) // 1 hour TTL

const commandBus = createCommandBus([
  loggingMiddleware,
  createAuthorizationMiddleware(authPolicy, getUserContext),
  createIdempotencyMiddleware(idempotencyStore),
  validationMiddleware
])

commandBus.register(TODO_AGGREGATE_TYPE, handleTodoCommand)

// --- Setup Query Bus ---
const queryBus = createQueryBus()

queryBus.register('getAllTodos', getAllTodosHandler)
queryBus.register('getTodoById', getTodoByIdHandler)
queryBus.register('getTodosByStatus', getTodosByStatusHandler)

// --- Example Usage ---
async function runTodoExample() {
  console.log('\n=== Todo App Example ===\n')

  // Create some todos
  const todoId1 = uuidv4()
  const todoId2 = uuidv4()
  const todoId3 = uuidv4()

  console.log('--- Creating Todos ---')
  
  const createCommand1: CreateTodoCommand = {
    commandId: uuidv4(),
    operation: 'create',
    aggregateType: TODO_AGGREGATE_TYPE,
    aggregateId: todoId1,
    payload: {
      title: 'Learn TypeScript',
      description: 'Study TypeScript fundamentals and advanced features'
    }
  }

  const createCommand2: CreateTodoCommand = {
    commandId: uuidv4(),
    operation: 'create',
    aggregateType: TODO_AGGREGATE_TYPE,
    aggregateId: todoId2,
    payload: {
      title: 'Build Todo App',
      description: 'Create a full-featured todo application'
    }
  }

  const createCommand3: CreateTodoCommand = {
    commandId: uuidv4(),
    operation: 'create',
    aggregateType: TODO_AGGREGATE_TYPE,
    aggregateId: todoId3,
    payload: {
      title: 'Deploy Application',
      description: 'Deploy the todo app to production'
    }
  }

  await commandBus.dispatch(createCommand1)
  await commandBus.dispatch(createCommand2)
  await commandBus.dispatch(createCommand3)

  console.log('✓ Created 3 todos')

  // Query all todos
  console.log('\n--- Querying All Todos ---')
  const allTodosQuery: GetAllTodosQuery = { operation: 'getAllTodos' }
  const allTodosResult = await queryBus.dispatch(allTodosQuery)
  console.log(`Found ${allTodosResult.data.length} todos:`)
  allTodosResult.data.forEach(todo => {
    console.log(`- ${todo.title} (${todo.status})`)
  })

  // Update a todo
  console.log('\n--- Updating Todo ---')
  const updateCommand: UpdateTodoCommand = {
    commandId: uuidv4(),
    operation: 'update',
    aggregateType: TODO_AGGREGATE_TYPE,
    aggregateId: todoId1,
    payload: {
      title: 'Master TypeScript',
      description: 'Become proficient in TypeScript with advanced patterns'
    }
  }
  await commandBus.dispatch(updateCommand)
  console.log('✓ Updated todo')

  // Change status
  console.log('\n--- Changing Todo Status ---')
  const statusCommand1: ChangeStatusCommand = {
    commandId: uuidv4(),
    operation: 'changeStatus',
    aggregateType: TODO_AGGREGATE_TYPE,
    aggregateId: todoId1,
    payload: { status: TodoStatus.IN_PROGRESS }
  }

  const statusCommand2: ChangeStatusCommand = {
    commandId: uuidv4(),
    operation: 'changeStatus',
    aggregateType: TODO_AGGREGATE_TYPE,
    aggregateId: todoId2,
    payload: { status: TodoStatus.COMPLETED }
  }

  await commandBus.dispatch(statusCommand1)
  await commandBus.dispatch(statusCommand2)
  console.log('✓ Changed todo statuses')

  // Query by status
  console.log('\n--- Querying by Status ---')
  const pendingQuery: GetTodosByStatusQuery = {
    operation: 'getTodosByStatus',
    params: { status: TodoStatus.PENDING }
  }
  const completedQuery: GetTodosByStatusQuery = {
    operation: 'getTodosByStatus',
    params: { status: TodoStatus.COMPLETED }
  }

  const pendingResult = await queryBus.dispatch(pendingQuery)
  const completedResult = await queryBus.dispatch(completedQuery)

  console.log(`Pending todos: ${pendingResult.data.length}`)
  pendingResult.data.forEach(todo => console.log(`- ${todo.title}`))

  console.log(`Completed todos: ${completedResult.data.length}`)
  completedResult.data.forEach(todo => console.log(`- ${todo.title}`))

  // Query by ID
  console.log('\n--- Querying by ID ---')
  const byIdQuery: GetTodoByIdQuery = {
    operation: 'getTodoById',
    entityId: todoId1
  }
  const byIdResult = await queryBus.dispatch(byIdQuery)
  if (byIdResult.data) {
    console.log(`Found todo: ${byIdResult.data.title} (${byIdResult.data.status})`)
  }

  // Delete a todo
  console.log('\n--- Deleting Todo ---')
  const deleteCommand: DeleteTodoCommand = {
    commandId: uuidv4(),
    operation: 'delete',
    aggregateType: TODO_AGGREGATE_TYPE,
    aggregateId: todoId3,
    payload: {}
  }
  await commandBus.dispatch(deleteCommand)
  console.log('✓ Deleted todo')

  // Final state
  console.log('\n--- Final State ---')
  const finalTodos = await queryBus.dispatch(allTodosQuery)
  console.log(`Remaining todos: ${finalTodos.data.length}`)
  finalTodos.data.forEach(todo => {
    console.log(`- ${todo.title} (${todo.status}) - Updated: ${todo.updatedAt.toISOString()}`)
  })

  console.log('\n--- Events in Store ---')
  console.log(`Total events: ${eventStore.getEventsForDebug().length}`)
}

// Run the example
runTodoExample().catch(error => {
  console.error('Todo example failed:', error)
})

// Export for HTTP API usage
export {
  commandBus,
  queryBus,
  TodoStatus,
  type TodoState,
  type CreateTodoCommand,
  type UpdateTodoCommand,
  type ChangeStatusCommand,
  type DeleteTodoCommand,
  type GetAllTodosQuery,
  type GetTodoByIdQuery,
  type GetTodosByStatusQuery
}