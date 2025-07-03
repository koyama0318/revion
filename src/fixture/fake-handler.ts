import type { AnyAggregate } from '../command/aggregate'
import type { CommandBus, CommandHandlerMiddleware } from '../command/command-bus'
import { createCommandBus } from '../command/command-bus'
import type { AnyDomainService } from '../command/domain-service'
import type { EventBus } from '../event/event-bus'
import { createEventBus } from '../event/event-bus'
import type { AnyEventReactor } from '../event/event-reactor'
import type { QueryBus, QueryResultType } from '../query/query-bus'
import { createQueryBus } from '../query/query-bus'
import type { AnyQueryResolver } from '../query/query-resolver'
import type {
  AppError,
  AsyncResult,
  Command,
  CommandResult,
  DomainEvent,
  ExtendedDomainEvent,
  Query,
  QueryMap,
  View
} from '../types'
import { CommandDispatcherMock, EventStoreInMemory, ReadDatabaseInMemory, ok } from '../utils'

const handlerConfig = {
  // if true, the event bus ignores view projection error handling
  ignoreViewProjection: false
}

export class FakeHandler {
  readonly eventStore: EventStoreInMemory
  readonly readDatabase: ReadDatabaseInMemory
  readonly commandDispatcher: CommandDispatcherMock
  readonly config: typeof handlerConfig

  private readonly commandBus: CommandBus
  private readonly eventBus: EventBus
  private readonly queryBus: QueryBus

  constructor({
    aggregates = [],
    services = [],
    middleware = [],
    reactors = [],
    resolvers = [],
    eventStore = new EventStoreInMemory(),
    readDatabase = new ReadDatabaseInMemory(),
    commandDispatcher = new CommandDispatcherMock(),
    config = handlerConfig
  }: {
    aggregates?: AnyAggregate[]
    services?: AnyDomainService[]
    middleware?: CommandHandlerMiddleware[]
    reactors?: AnyEventReactor[]
    resolvers?: AnyQueryResolver[]
    eventStore?: EventStoreInMemory
    readDatabase?: ReadDatabaseInMemory
    commandDispatcher?: CommandDispatcherMock
    config?: typeof handlerConfig
  }) {
    this.eventStore = eventStore
    this.readDatabase = readDatabase
    this.commandDispatcher = commandDispatcher

    this.commandBus = createCommandBus({
      deps: { eventStore: this.eventStore },
      aggregates: aggregates ?? [],
      services: services ?? [],
      middleware: middleware ?? []
    })

    this.eventBus = createEventBus({
      deps: { commandDispatcher: this.commandDispatcher, readDatabase: this.readDatabase },
      reactors: reactors ?? []
    })

    this.queryBus = createQueryBus({
      deps: { readDatabase: this.readDatabase },
      resolvers: resolvers ?? []
    })

    this.config = { ...handlerConfig, ...config }
  }

  async command(command: Command): AsyncResult<CommandResult, AppError> {
    const beforeEvents = this.eventStore.events.slice()

    // command dispatch
    const dispatched = await this.commandBus(command)
    if (!dispatched.ok) return dispatched

    const afterEvents = this.eventStore.events.slice()

    const diff = afterEvents
      .filter(e => !beforeEvents.includes(e))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    // event Handle
    for (const event of diff) {
      // project view and dispatch commands
      const handled = await this.eventBus(event)
      if (!handled.ok) {
        if (this.config.ignoreViewProjection && handled.error?.code === 'VIEW_NOT_FOUND') continue
        return handled
      }

      // recursively dispatch commands
      const commands = this.commandDispatcher.getCommands().slice()
      this.commandDispatcher.reset()

      for (const command of commands) {
        const dispatched = await this.command(command)
        if (!dispatched.ok) return dispatched
      }
    }

    return ok(dispatched.value)
  }

  async query<Q extends Query, QM extends QueryMap>(
    query: Q
  ): AsyncResult<QueryResultType<QM, Q>, AppError> {
    return await this.queryBus<Q, QM>(query)
  }

  setEventStore(events: ExtendedDomainEvent<DomainEvent>[]) {
    this.eventStore.events = [...events]
  }

  setReadDatabase(storage: Record<string, Record<string, View>>) {
    this.readDatabase.storage = storage
  }

  log(): string {
    return `event store: ${JSON.stringify(this.eventStore.events, null, 2)}\nevent queue: ${JSON.stringify(this.commandDispatcher.getCommands(), null, 2)}\nread database: ${JSON.stringify(this.readDatabase.storage, null, 2)}`
  }
}
