import type { Aggregate } from '../command/aggregate'
import type { CommandHandlerDeps } from '../command/command-handler'
import { createReplayEventFnFactory } from '../command/fn/replay-event'
import type { EventReactor } from '../event/event-reactor'
import type {
  AggregateId,
  AppError,
  AsyncResult,
  Command,
  DomainEvent,
  ExtendedDomainEvent,
  ExtendedState,
  State,
  ViewMap
} from '../types'
import { zeroId } from '../utils/aggregate-id'
import { FakeHandler } from './fake-handler'

type AggregateTestContext<S extends State, E extends DomainEvent> = {
  id: AggregateId
  state: {
    before: S
    after: S
  }
  events: {
    before: ExtendedDomainEvent<E>[]
    after: ExtendedDomainEvent<E>[]
    latest: ExtendedDomainEvent<E> | null
    all: ExtendedDomainEvent<E>[]
  }
  version: {
    diff: number
    latest: number
  }
  error: AppError | null
}

class AggregateTestFixture<
  T extends string,
  S extends State,
  C extends Command,
  E extends DomainEvent,
  VM extends ViewMap
> {
  private readonly aggregate: Aggregate<T, S, C, E>
  private readonly handler: FakeHandler
  private context: AggregateTestContext<S, E>

  constructor(aggregate: Aggregate<T, S, C, E>, reactor: EventReactor<T, C, E, VM>) {
    this.aggregate = aggregate
    this.handler = new FakeHandler({
      aggregates: [aggregate],
      reactors: [reactor],
      config: {
        ignoreViewProjection: true
      }
    })

    const id = zeroId(aggregate.type) as AggregateId<T>
    this.context = {
      id,
      state: {
        before: aggregate.stateInit(id),
        after: aggregate.stateInit(id)
      },
      events: { before: [], after: [], latest: null, all: [] },
      version: { diff: 0, latest: 0 },
      error: null
    }
  }

  givenId(id: AggregateId<T>) {
    this.context.id = id
    return this
  }

  given(event: E) {
    const e = {
      event: event,
      aggregateId: this.context.id,
      version: this.context.version.latest + 1,
      timestamp: new Date()
    }
    this.context.events.before.push(e)
    this.context.events.all.push(e)
    this.context.version.latest += 1
    return this
  }

  givenMany(events: E[]) {
    for (const event of events) {
      this.given(event)
    }
    return this
  }

  async when(command: C) {
    // set before events & before state
    this.handler.setEventStore(this.context.events.before)

    const before = await this.replayEvents()
    if (!before.ok) {
      this.context.error = before.error
      return this
    }
    this.context.state.before = before.value.state

    // execute command
    const res = await this.handler.command(command)
    if (!res.ok) {
      this.context.error = res.error
    }

    // set after events & after state
    this.context.events.all = this.handler.eventStore.events as ExtendedDomainEvent<E>[]
    this.context.events.after = this.context.events.all.slice(this.context.events.before.length)
    this.context.version.latest = this.context.events.all.length
    this.context.version.diff = this.context.version.latest - this.context.events.before.length

    const after = await this.replayEvents()
    if (!after.ok) {
      this.context.error = after.error
      return this
    }
    this.context.state.after = after.value.state

    return this
  }

  assert(assert: (context: AggregateTestContext<S, E>) => void) {
    assert(this.context as AggregateTestContext<S, E>)
    return this
  }

  private async replayEvents(): AsyncResult<ExtendedState<S>, AppError> {
    const replayFn = createReplayEventFnFactory<T, S, E, CommandHandlerDeps>(
      this.aggregate.stateInit,
      this.aggregate.reducer
    )({ eventStore: this.handler.eventStore })

    const replayed = await replayFn(this.context.id as AggregateId<T>)
    if (!replayed.ok) {
      this.context.error = replayed.error
    }
    return replayed
  }
}

export function aggregateFixture<
  T extends string,
  S extends State,
  C extends Command,
  E extends DomainEvent,
  VM extends ViewMap
>(aggregate: Aggregate<T, S, C, E>, reactor: EventReactor<T, C, E, VM>) {
  return new AggregateTestFixture(aggregate, reactor)
}
