import { CommandBus } from '../command/command-bus'
import { EventBus } from '../event/event-bus'
import { QueryBus } from '../query/query-bus'
import type { Command, CommandHandlerFactory, CommandMiddleware } from '../types/command'
import type { LiteCommand } from '../types/command-lite'
import type { AppError } from '../types/error'
import type { EventHandlerFactory } from '../types/event'
import type { EventStore } from '../types/event-store'
import type { Query, QueryHandlerFactory } from '../types/query'
import type { ReadStorage } from '../types/read-storage'
import { EventStoreInMemory } from './event-store-in-memory'
import { ReadStorageInMemory } from './read-storage-in-memory'
import type { AsyncResult } from './result'
import { ok } from './result'

export class FakeHandler {
  readonly eventStore: EventStore
  readonly readStorage: ReadStorage
  readonly commandBus: CommandBus
  readonly eventBus: EventBus
  readonly queryBus: QueryBus

  constructor(
    private readonly commands: Record<string, CommandHandlerFactory>,
    private readonly events: Record<string, EventHandlerFactory>,
    private readonly queries: Record<string, QueryHandlerFactory>,
    private readonly commandMiddlewares: CommandMiddleware[] = []
  ) {
    this.eventStore = new EventStoreInMemory()
    this.readStorage = new ReadStorageInMemory()

    const commandHandlers = Object.fromEntries(
      Object.entries(this.commands).map(([key, handler]) => [key, handler(this.eventStore)])
    )

    const eventHandlers = Object.fromEntries(
      Object.entries(this.events).map(([key, handler]) => [key, handler(this.readStorage)])
    )

    const queryHandlers = Object.fromEntries(
      Object.entries(this.queries).map(([key, handler]) => [key, handler(this.readStorage)])
    )

    this.commandBus = new CommandBus(commandHandlers, this.commandMiddlewares)
    this.eventBus = new EventBus(eventHandlers)
    this.queryBus = new QueryBus(queryHandlers)
  }

  async dispatch(command: LiteCommand): AsyncResult<void, AppError> {
    const lastEventVersion = await this.eventStore.getLastEventVersion(command.aggregateId)
    if (!lastEventVersion.ok) {
      return lastEventVersion
    }

    await this.commandBus.dispatch({
      ...command,
      payload: command.payload ?? {}
    })

    const events = await this.eventStore.getEvents(command.aggregateId, lastEventVersion.value + 1)
    if (!events.ok) {
      return events
    }

    for (const event of events.value) {
      await this.eventBus.receive(event)
    }

    console.log('eventstore:', await this.eventStore.getEvents(command.aggregateId))
    console.log('snapshot:', await this.eventStore.getSnapshot(command.aggregateId))
    console.log('readstorage:', await this.readStorage.getList(command.aggregateId))

    return ok(undefined)
  }

  async query(query: Query) {
    return this.queryBus.execute(query)
  }
}
