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

  load(id: AggregateId): Event[] {
    return this.events.filter(
      event => event.id.type === id.type && event.id.id === id.id
    )
  }

  all(): Event[] {
    return this.events
  }

  save(events: Event[]) {
    this.events.push(...events)
  }
}

class CommandDispatcherInMemory implements CommandDispatcher {
  commands: Command[]

  constructor(commands: Command[] = []) {
    this.commands = commands
  }

  dispatch(command: Command): void {
    this.commands.push(command)
  }
}

export function integrationTest(
  aggregates: Aggregate[],
  listeners: EventListener[],
  cases: Command[]
): Event[] {
  const events: Event[] = []
  const eventStore = new EventStoreInMemory(events)
  const commandHandler = new CommandHandler(eventStore, aggregates)

  const commands: Command[] = []
  const dispatcher = new CommandDispatcherInMemory(commands)
  const eventHandler = new EventHandler(dispatcher, listeners)

  const process: (command: Command) => void = command => {
    const beforeEvents = [...events]
    commandHandler.handle(command)

    const diffEvents = [...events].filter(
      event => !beforeEvents.includes(event)
    )

    for (const event of diffEvents) {
      const beforeCommands = [...commands]
      eventHandler.handle(event)

      const diffCommands = [...commands].filter(
        command => !beforeCommands.includes(command)
      )
      for (const command of diffCommands) {
        process(command)
      }
    }
  }

  cases.forEach(command => {
    process(command)
  })

  return events
}
