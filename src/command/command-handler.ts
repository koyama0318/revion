import type {
  AggregateId,
  AppError,
  AsyncResult,
  Command,
  DomainEvent,
  EventStore,
  State
} from '../types'
import { err, ok } from '../utils'
import type { Aggregate, AnyAggregate } from './aggregate'
import type { CombinedFnFactory } from './combined'
import { createCombinedApplyFn, createCombinedReplayFn, createCombinedSaveFn } from './combined'
import type { AnyDomainService, DomainService } from './domain-service'
import { createApplyEventFnFactory } from './fn/apply-event'
import { createReplayEventFnFactory } from './fn/replay-event'
import { createSaveEventFnFactory } from './fn/save-event'

export type CommandHandlerDeps = {
  eventStore: EventStore
}

export type CommandHandler = (command: Command) => AsyncResult<void, AppError>

type CommandHandlerFactory<D extends CommandHandlerDeps = CommandHandlerDeps> = (
  deps: D
) => CommandHandler

function createCommandHandlerFactory<
  T extends string,
  S extends State,
  C extends Command,
  E extends DomainEvent,
  D extends CommandHandlerDeps
>(aggregate: Aggregate<T, S, C, E>): CommandHandlerFactory<D> {
  return (deps: D) => {
    const replayFn = createReplayEventFnFactory<T, S, E, D>(
      aggregate.stateInit,
      aggregate.reducer
    )(deps)
    const applyFn = createApplyEventFnFactory<S, C, E>(aggregate.eventDecider, aggregate.reducer)()
    const saveFn = createSaveEventFnFactory<S, E, D>()(deps)

    return async (command: Command): AsyncResult<void, AppError> => {
      const replayed = await replayFn(command.id as AggregateId<T>)
      if (!replayed.ok) return replayed

      const applied = await applyFn(replayed.value, command as C)
      if (!applied.ok) return applied

      const saved = await saveFn(applied.value.state, applied.value.events)
      if (!saved.ok) return saved

      return ok(undefined)
    }
  }
}

function createDomainServiceFactory<
  T extends string,
  C extends Command,
  D extends CommandHandlerDeps
>(
  combinedFnFactory: CombinedFnFactory,
  domainService: DomainService<T, C>
): CommandHandlerFactory<D> {
  return (deps: D): CommandHandler => {
    return async (command: Command): AsyncResult<void, AppError> => {
      return await domainService
        .applyEvent(command as C, combinedFnFactory(deps))
        .then(_ => ok(undefined))
        .catch(e => {
          return err({
            code: 'DOMAIN_SERVICE_ERROR',
            message: 'Domain service error',
            cause: e
          })
        })
    }
  }
}

export function createCommandHandlers(
  deps: CommandHandlerDeps,
  aggregates: AnyAggregate[],
  services: AnyDomainService[]
): Record<string, CommandHandler> {
  const combinedFactory = (deps: CommandHandlerDeps) => {
    return {
      replayFn: createCombinedReplayFn(deps, aggregates),
      applyFn: createCombinedApplyFn(aggregates),
      saveFn: createCombinedSaveFn(deps)
    }
  }

  const handlers: Record<string, CommandHandler> = {}

  for (const aggregate of aggregates) {
    handlers[aggregate.type] = createCommandHandlerFactory(aggregate)(deps)
  }

  for (const service of services) {
    handlers[service.type] = createDomainServiceFactory(combinedFactory, service)(deps)
  }

  return handlers
}
