import type {
  AppError,
  AsyncResult,
  Command,
  CommandDispatcher,
  DomainEvent,
  ExtendedDomainEvent,
  PolicyFn
} from '../../types'
import { ok } from '../../utils'

type DispatchEventFn<E extends DomainEvent> = (
  event: ExtendedDomainEvent<E>
) => AsyncResult<void, AppError>

export function createDispatchEventFnFactory<C extends Command, E extends DomainEvent>(
  policy: PolicyFn<C, E>
): (deps: CommandDispatcher) => DispatchEventFn<E> {
  return (deps: CommandDispatcher) => {
    return async (event: ExtendedDomainEvent<E>) => {
      const command = policy(event)
      if (!command) return ok(undefined)

      return await deps.dispatch(command)
    }
  }
}
