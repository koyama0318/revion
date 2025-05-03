import { CommandBus } from '../command/command-bus'
import { EventBus } from '../event/event-bus'
import { QueryBus } from '../query/query-bus'
import type { CommandHandlerDeps, CommandHandlerFactory } from '../types/command'
import type { LiteCommand } from '../types/command-lite'
import type { AppError } from '../types/error'
import type { EventHandlerFactory } from '../types/event'
import type { Query, QueryHandlerFactory } from '../types/query'
import type { ReadStorage } from '../types/read-storage'
import { ReadStorageInMemory } from './read-storage-in-memory'
import type { AsyncResult } from './result'
import { err, ok, toResult } from './result'

export class FakeHandler<CD extends CommandHandlerDeps> {
  readonly readStorage: ReadStorage
  readonly commandBus: CommandBus
  readonly eventBus: EventBus
  readonly queryBus: QueryBus

  constructor(
    private readonly commands: Record<string, CommandHandlerFactory<CD>>,
    private readonly events: Record<string, EventHandlerFactory>,
    private readonly queries: Record<string, QueryHandlerFactory>,
    private readonly commandDeps: CD
  ) {
    this.readStorage = new ReadStorageInMemory()

    const commandHandlers = Object.fromEntries(
      Object.entries(this.commands).map(([key, handler]) => [key, handler(this.commandDeps)])
    )

    const eventHandlers = Object.fromEntries(
      Object.entries(this.events).map(([key, handler]) => [key, handler(this.readStorage)])
    )

    const queryHandlers = Object.fromEntries(
      Object.entries(this.queries).map(([key, handler]) => [key, handler(this.readStorage)])
    )

    this.commandBus = new CommandBus(commandHandlers, [])
    this.eventBus = new EventBus(eventHandlers)
    this.queryBus = new QueryBus(queryHandlers)
  }

  async dispatch(command: LiteCommand): AsyncResult<void, AppError> {
    const gotVersion = await toResult(() =>
      this.commandDeps.eventStore.getLastEventVersion(command.aggregateId)
    )
    if (!gotVersion.ok) {
      return err({
        code: 'LAST_EVENT_VERSION_CANNOT_BE_LOADED',
        message: 'Last event version cannot be loaded',
        cause: gotVersion.error
      })
    }

    await this.commandBus.dispatch({
      ...command,
      payload: command.payload ?? {}
    })

    const events = await toResult(() =>
      this.commandDeps.eventStore.getEvents(command.aggregateId, gotVersion.value + 1)
    )
    if (!events.ok) {
      return err({
        code: 'EVENTS_CANNOT_BE_LOADED',
        message: 'Events cannot be loaded',
        cause: events.error
      })
    }

    for (const event of events.value) {
      await this.eventBus.receive(event)
    }

    console.log('eventstore:', await this.commandDeps.eventStore.getEvents(command.aggregateId))
    console.log('snapshot:', await this.commandDeps.eventStore.getSnapshot(command.aggregateId))
    console.log('readstorage:', await this.readStorage.getList(command.aggregateId))

    return ok(undefined)
  }

  async query(query: Query) {
    return this.queryBus.execute(query)
  }
}
