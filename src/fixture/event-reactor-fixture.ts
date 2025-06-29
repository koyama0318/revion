import type { EventReactor } from '../event/event-reactor'
import { createDispatchEventFnFactory } from '../event/fn/dispatch-event'
import { createProjectEventFnFactory } from '../event/fn/project-event'
import type { AppError, Command, DomainEvent, ExtendedDomainEvent, View, ViewMap } from '../types'
import { CommandDispatcherMock } from '../utils/command-dispatcher-mock'
import { ReadDatabaseInMemory } from '../utils/read-database-in-memory'

type ReactorTestContext = {
  view: {
    before: Record<string, Record<string, View>>
    after: Record<string, Record<string, View>>
  }
  command: {
    after: Command[]
    count: number
  }
  error: AppError | null
}

class ReactorTestFixture<
  T extends string,
  C extends Command,
  E extends DomainEvent,
  VM extends ViewMap
> {
  private readonly commandDispatcher: CommandDispatcherMock
  private readonly readDatabase: ReadDatabaseInMemory
  private readonly reactor: EventReactor<T, C, E, VM>
  private context: ReactorTestContext

  constructor(reactor: EventReactor<T, C, E, VM>) {
    this.commandDispatcher = new CommandDispatcherMock()
    this.readDatabase = new ReadDatabaseInMemory()
    this.reactor = reactor
    this.context = {
      view: { before: {}, after: {} },
      command: { after: [], count: 0 },
      error: null
    }
  }

  given(view: VM[keyof VM]) {
    this.context.view.before = {
      ...this.context.view.before,
      [view.type]: { ...(this.context.view.before[view.type] ?? {}), [view.id]: view }
    }
    return this
  }

  async when(event: ExtendedDomainEvent<E>) {
    // reset
    this.commandDispatcher.reset()
    this.readDatabase.storage = this.context.view.before

    // execute receiving command
    const dispatchFn = createDispatchEventFnFactory(this.reactor.policy)(this.commandDispatcher)
    const dispatch = await dispatchFn(event)
    if (!dispatch.ok) {
      this.context.error = dispatch.error
    }

    const projectionFn = createProjectEventFnFactory(this.reactor.projection)(this.readDatabase)
    const projection = await projectionFn(event)
    if (!projection.ok) {
      this.context.error = projection.error
    }

    // set after view
    this.context.command.after = this.commandDispatcher.getCommands() as C[]
    this.context.command.count = this.context.command.after.length
    this.context.view.after = this.readDatabase.storage

    return this
  }

  assert(assert: (context: ReactorTestContext) => void) {
    assert(this.context)
    return this
  }
}

export function reactorFixture<
  T extends string,
  C extends Command,
  E extends DomainEvent,
  VM extends ViewMap
>(reactor: EventReactor<T, C, E, VM>) {
  return new ReactorTestFixture(reactor)
}
