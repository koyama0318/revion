import type {
  AppError,
  AsyncResult,
  Command,
  CommandDispatcher,
  DomainEvent,
  ExtendedDomainEvent,
  PolicyFn
} from '../../types'
import { err, ok, toAsyncResult } from '../../utils'

type DispatchEventFn<E extends DomainEvent> = (
  event: ExtendedDomainEvent<E>
) => AsyncResult<void, AppError>

export function createDispatchEventFnFactory<C extends Command, E extends DomainEvent>(
  policy: PolicyFn<C, E>
): (deps: CommandDispatcher) => DispatchEventFn<E> {
  return (deps: CommandDispatcher) => {
    return async (event: ExtendedDomainEvent<E>): AsyncResult<void, AppError> => {
      const command = policy(event)
      if (!command) return ok(undefined)

      const dispatched = await toAsyncResult(() => deps.dispatch(command))
      if (!dispatched.ok) {
        return err({
          code: 'COMMAND_DISPATCH_FAILED',
          message: 'Command dispatch failed',
          cause: dispatched.error
        })
      }

      return ok(undefined)
    }
  }
}
