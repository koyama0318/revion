import type { CommandHandlerDeps, CommandHandlerFactory } from '../types/command'
import type {
  LiteCommand,
  LiteCommandReplayer,
  LiteDomainEvent,
  LiteEventDecider,
  LiteReducer,
  LiteState
} from '../types/command-lite'
import type { AggregateId, Id } from '../types/id'
import { createLiteCommandHandler } from './command-handler'

type CommandFactories<
  LS extends LiteState,
  LE extends LiteDomainEvent,
  CD extends CommandHandlerDeps
> = {
  handler: CommandHandlerFactory<CD>
  replayer: LiteCommandReplayer<LS, LE>
}

export const createCommandHandler = <
  T extends string,
  LS extends LiteState,
  LC extends LiteCommand,
  LE extends LiteDomainEvent,
  CD extends CommandHandlerDeps = CommandHandlerDeps
>({
  aggregateType,
  initState,
  decider,
  reducer
}: {
  aggregateType: T
  initState: (id: Id<T>) => LS
  decider: LiteEventDecider<LS, LC, LE>
  reducer: LiteReducer<LS, LE>
}): CommandFactories<LS, LE, CD> => {
  const initStateFn = (id: AggregateId) => initState(id as Id<T>)
  return {
    handler: createLiteCommandHandler(initStateFn, decider, reducer),
    replayer: {
      aggregateType,
      initState: initStateFn,
      reducer
    }
  }
}
