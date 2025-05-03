import type {
  Command,
  CommandHandler,
  CommandHandlerDeps,
  CommandHandlerFactory
} from '../types/command'
import type { AnyLiteCommandReplayer } from '../types/command-lite'
import type {
  AnyCommandReplayer,
  DomainServiceEventDecider,
  DomainServiceEventDeciderFactory,
  Replay
} from '../types/command-service'
import type { AppError } from '../types/error'
import type { EventStore } from '../types/event-store'
import type { AggregateId } from '../types/id'
import { parseAggregateId } from '../types/id'
import { type AsyncResult, err, ok, toResult } from '../utils/result'
import { extendLiteReducer } from './command-lite'
import { replayState } from './replay-state'

class ServiceCommandProcessor {
  constructor(
    private readonly decider: DomainServiceEventDecider,
    private readonly replayers: AnyCommandReplayer[],
    private readonly eventStore: EventStore
  ) {}

  async handle(command: Command): AsyncResult<void, AppError> {
    const replayFn: Replay = async (id: AggregateId) => {
      const idResult = parseAggregateId(id)
      if (!idResult.ok) {
        return idResult
      }
      const { type } = idResult.value
      const replayer = this.replayers.find(r => r.aggregateType === type)
      if (!replayer) {
        return err({
          code: 'REPLAYER_NOT_FOUND',
          message: 'Replay function not found'
        })
      }

      return await replayState({
        aggregateId: id,
        initState: replayer.initState,
        reducer: replayer.reducer,
        eventStore: this.eventStore
      })
    }

    const decided = await this.decider(command, replayFn)
    if (!decided.ok) {
      return decided
    }

    const events = decided.value.map(e => ({
      ...e,
      version: 0,
      timestamp: new Date()
    }))
    console.log('service events', events)

    // TODO: version check
    const savedEvents = await toResult(() => this.eventStore.saveEvents(events))
    if (!savedEvents.ok) {
      return err({
        code: 'EVENTS_CANNOT_BE_SAVED',
        message: 'Events cannot be saved',
        cause: savedEvents.error
      })
    }

    return ok(undefined)
  }
}

const createServiceCommandHandler = <CD extends CommandHandlerDeps>(
  deciderFactory: DomainServiceEventDeciderFactory<CD>,
  replayers: AnyCommandReplayer[]
): CommandHandlerFactory<CD> => {
  return (deps: CD): CommandHandler => {
    if (!deps.eventStore) {
      throw new Error('Event store is required')
    }
    const decider = deciderFactory(deps)
    const processor = new ServiceCommandProcessor(decider, replayers, deps.eventStore)

    return async (command: Command): AsyncResult<void, AppError> => {
      return processor.handle(command)
    }
  }
}

export const createLiteServiceCommandHandler = <CD extends CommandHandlerDeps>(
  deciderFactory: DomainServiceEventDeciderFactory<CD>,
  replayers: AnyLiteCommandReplayer[]
): CommandHandlerFactory<CD> => {
  const reps: AnyCommandReplayer[] = []
  for (const replayer of replayers) {
    if (!replayer.aggregateType) {
      throw new Error(`Replayer ${replayer.aggregateType} not found`)
    }

    reps.push({
      aggregateType: replayer.aggregateType,
      initState: (id: AggregateId) => {
        return { ...replayer.initState(id), version: 0 }
      },
      reducer: extendLiteReducer(replayer.reducer)
    })
  }

  return createServiceCommandHandler(deciderFactory, reps)
}
