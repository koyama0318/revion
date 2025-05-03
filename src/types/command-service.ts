import type { AsyncResult } from '../utils/result'
import type { Command, CommandHandlerDeps, DomainEvent, State } from './command'
import type { LiteState } from './command-lite'
import type { AppError } from './error'
import type { AggregateId } from './id'

export type Replay = (id: AggregateId) => AsyncResult<LiteState, AppError>

export type DomainServiceEventDecider = (
  command: Command,
  replay: Replay
) => AsyncResult<DomainEvent[], AppError>

export type DomainServiceEventDeciderFactory<D extends CommandHandlerDeps = CommandHandlerDeps> = (
  deps: D
) => DomainServiceEventDecider

// biome-ignore lint/suspicious/noExplicitAny:
export type AnyCommandReplayer = CommandReplayer<any, any>

export type CommandReplayer<S extends State, E extends DomainEvent> = {
  aggregateType: string
  initState: (id: AggregateId) => S
  reducer: (state: S, event: E) => S
}
