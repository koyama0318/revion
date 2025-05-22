import type { AnyAggregate } from '../command/aggregate'
import {
  type CommandBus,
  type CommandHandlerMiddleware,
  createCommandBus
} from '../command/command-bus'
import type { AnyDomainService } from '../command/domain-service'
import { type EventBus, createEventBus } from '../event/event-bus'
import type { AnyEventReactor } from '../event/event-reactor'
import { type QueryBus, type QueryResultType, createQueryBus } from '../query/query-bus'
import type { AnyQueryResolver } from '../query/query-resolver'
import type {
  AppError,
  AsyncResult,
  Command,
  DomainEvent,
  ExtendedDomainEvent,
  Query,
  QueryMap
} from '../types'
import { ok } from '../utils'
import { CommandDispatcherMock } from '../utils/command-dispatcher-mock'
import { EventStoreInMemory } from '../utils/event-store-in-memory'
import { ReadDatabaseInMemory } from '../utils/read-db-in-memory'

type FakeHandlerConfig = {
  shouldHandleAllEvents: boolean
}

const defaultConfig: FakeHandlerConfig = {
  shouldHandleAllEvents: true
}

export class FakeHandler {
  readonly eventStore: EventStoreInMemory
  readonly readDatabase: ReadDatabaseInMemory
  readonly commandDispatcher: CommandDispatcherMock

  private readonly commandBus: CommandBus
  private readonly eventBus: EventBus
  private readonly queryBus: QueryBus

  private readonly config: FakeHandlerConfig

  constructor({
    command = { aggregates: [], services: [], middleware: [] },
    event = { reactors: [] },
    query = { resolvers: [] },
    config = defaultConfig
  }: {
    command?: {
      aggregates?: AnyAggregate[]
      services?: AnyDomainService[]
      middleware?: CommandHandlerMiddleware[]
    }
    event?: {
      reactors?: AnyEventReactor[]
    }
    query?: {
      resolvers?: AnyQueryResolver[]
    }
    config?: FakeHandlerConfig
  } = {}) {
    this.eventStore = new EventStoreInMemory()
    this.readDatabase = new ReadDatabaseInMemory()
    this.commandDispatcher = new CommandDispatcherMock()

    this.commandBus = createCommandBus({
      deps: { eventStore: this.eventStore },
      aggregates: command.aggregates ?? [],
      services: command.services ?? [],
      middleware: command.middleware ?? []
    })

    this.eventBus = createEventBus({
      deps: { commandDispatcher: this.commandDispatcher, readDatabase: this.readDatabase },
      reactors: event.reactors ?? []
    })

    this.queryBus = createQueryBus({
      deps: { readDatabase: this.readDatabase },
      resolvers: query.resolvers ?? []
    })

    this.config = config
  }

  async command(command: Command): AsyncResult<void, AppError> {
    const beforeEvents = this.eventStore.events

    // Command
    const dispatched = await this.commandBus(command)
    if (!dispatched.ok) {
      return dispatched
    }

    const afterEvents = this.eventStore.events

    const diff = afterEvents
      .filter(e => !beforeEvents.includes(e))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    // Event Handle
    for (const event of diff) {
      // Project view and dispatch commands
      const handled = await this.eventBus(event)
      if (!handled.ok) {
        if (
          !this.config.shouldHandleAllEvents &&
          handled.error.code === 'EVENT_HANDLER_NOT_FOUND'
        ) {
          break
        }
        return handled
      }

      // recursively dispatch commands
      const commands = this.commandDispatcher.getCommands()
      for (const command of commands) {
        const dispatched = await this.command(command)
        if (!dispatched.ok) {
          return dispatched
        }
      }
      this.commandDispatcher.reset()
    }

    return ok(undefined)
  }

  async query<Q extends Query, QM extends QueryMap>(
    query: Q
  ): AsyncResult<QueryResultType<QM, Q>, AppError> {
    return await this.queryBus<Q, QM>(query)
  }

  setEventStore(events: ExtendedDomainEvent<DomainEvent>[]) {
    this.eventStore.events = [...events]
  }

  reset() {
    this.eventStore.events = []
    this.eventStore.snapshots = []
    this.readDatabase.storage = {}
  }
}
