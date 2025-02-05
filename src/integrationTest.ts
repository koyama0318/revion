import { CommandHandler, EventHandler } from './handler'
import type { Aggregate, AggregateId, Command, Event } from './types/aggregate'
import type { CommandDispatcher } from './types/dispatcher'
import type { EventListener } from './types/eventListener'
import type { EventStore } from './types/eventStore'

class EventStoreInMemory implements EventStore {
  events: Event[] = []

  constructor(events: Event[]) {
    this.events = events
  }

  async load(id: AggregateId): Promise<Event[]> {
    return this.events.filter(
      event => event.id.type === id.type && event.id.id === id.id
    )
  }

  async save(events: Event[]) {
    this.events.push(...events)
  }
}

class CommandDispatcherInMemory implements CommandDispatcher {
  commands: Command[]

  constructor(commands: Command[] = []) {
    this.commands = commands
  }

  async dispatch(command: Command): Promise<void> {
    this.commands.push(command)
  }
}

export async function integrationTest(
  aggregates: Aggregate[],
  listeners: EventListener[],
  cases: Command[]
): Promise<Event[]> {
  const events: Event[] = []
  const eventStore = new EventStoreInMemory(events)
  const commandHandler = new CommandHandler(eventStore, aggregates)

  const commands: Command[] = []
  const dispatcher = new CommandDispatcherInMemory(commands)
  const eventHandler = new EventHandler(dispatcher, listeners)

  const process = async (command: Command) => {
    const beforeEvents = [...events]
    await commandHandler.handle(command)

    const diffEvents = [...events].filter(
      event => !beforeEvents.includes(event)
    )

    for (const event of diffEvents) {
      const beforeCommands = [...commands]
      await eventHandler.handle(event)

      const diffCommands = [...commands].filter(
        command => !beforeCommands.includes(command)
      )
      for (const command of diffCommands) {
        await process(command)
      }
    }
  }

  for (const command of cases) {
    await process(command)
  }

  return events
}
