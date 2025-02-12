import { CommandHandler, EventHandler, QueryHandler } from '../../handler'
import type { Aggregate, Command, Event } from '../../types/aggregate'
import type { EventListener } from '../../types/eventListener'
import type { Query, ReadModel } from '../../types/query'
import {
  CommandDispatcherInMemory,
  EventStoreInMemory,
  ReadModelStoreInMemory,
  type ReadModelRecord
} from './storeInMemory'

export class FakeHandler {
  private eventStore: EventStoreInMemory
  private dispatcher: CommandDispatcherInMemory
  private readModelStore: ReadModelStoreInMemory

  constructor(
    private aggregates: Aggregate[],
    private listeners: EventListener[]
  ) {
    this.eventStore = new EventStoreInMemory([])
    this.dispatcher = new CommandDispatcherInMemory(async command => {
      await this.command(command)
    })
    this.readModelStore = new ReadModelStoreInMemory([])
  }

  async command(command: Command): Promise<void> {
    this.aggregates.forEach(a => {
      a.reset()
    })
    const commandHandler = new CommandHandler(this.eventStore, this.aggregates)
    const eventHandler = new EventHandler(
      this.dispatcher,
      this.readModelStore,
      this.listeners
    )

    // MARK: Command
    const beforeEvents = [...this.eventStore.events]
    await commandHandler.handle(command)
    const diffEvents = [...this.eventStore.events].filter(
      event => !beforeEvents.includes(event)
    )

    // MARK: EventListener
    for (const event of diffEvents) {
      await eventHandler.handle(event)
    }
  }

  async query<T extends ReadModel>(query: Query<T>): Promise<T[]> {
    const queryHandler = new QueryHandler(this.readModelStore)
    return await queryHandler.query(query)
  }

  getEvents(): Event[] {
    return this.eventStore.events
  }

  getReadModels(): ReadModelRecord[] {
    return this.readModelStore.records
  }

  log() {
    console.log('event_store:', this.eventStore.events)
    console.log('query_store:', this.readModelStore.records)
  }
}
