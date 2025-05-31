import type {
  AppError,
  AsyncResult,
  DomainEvent,
  ExtendedDomainEvent,
  ProjectionFn,
  ReadDatabase,
  View,
  ViewMap
} from '../../types'
import { err, ok, toAsyncResult } from '../../utils'

export type ProjectEventFn<E extends DomainEvent> = (
  event: ExtendedDomainEvent<E>
) => AsyncResult<void, AppError>

export function createProjectEventFnFactory<E extends DomainEvent, VM extends ViewMap>(
  projection: ProjectionFn<E, VM>
): (db: ReadDatabase) => ProjectEventFn<E> {
  return (db: ReadDatabase) => {
    return async (event: ExtendedDomainEvent<E>): AsyncResult<void, AppError> => {
      const eventType = event.event.type as E['type']
      const defs = projection[eventType]
      if (!defs) {
        return err({
          code: 'EVENT_TYPE_NOT_FOUND',
          message: `Event type ${eventType} not found`
        })
      }

      for (const [viewType, def] of Object.entries(defs)) {
        if ('init' in def) {
          const view = def.init(event)
          const existing = await toAsyncResult(() => db.getById(viewType, view.id))
          if (!existing.ok) {
            return err({
              code: 'GET_VIEW_FAILED',
              message: `Get view failed: ${viewType}#${view.id} event: ${event.event.type} v${event.version}`
            })
          }
          if (existing.value) {
            return err({
              code: 'VIEW_ALREADY_EXISTS',
              message: `View already exists: ${viewType}#${view.id} event: ${event.event.type} v${event.version}`
            })
          }

          const saved = await toAsyncResult(() => db.save(viewType, view))
          if (!saved.ok) {
            return err({
              code: 'SAVE_VIEW_FAILED',
              message: `Save view failed: ${viewType}#${view.id} event: ${event.event.type} v${event.version}`
            })
          }

          continue
        }

        if ('id' in def && 'apply' in def) {
          const id: string = def.id(event)
          const view = await toAsyncResult(() => db.getById(viewType, id))
          if (!view.ok) {
            return err({
              code: 'GET_VIEW_FAILED',
              message: `Get view failed: ${viewType}#${id} event: ${event.event.type} v${event.version}`
            })
          }
          if (!view.value) {
            return err({
              code: 'VIEW_NOT_FOUND',
              message: `View not found: ${viewType}#${id} event: ${event.event.type} v${event.version}`
            })
          }

          def.apply(event, view.value)

          const saved = await toAsyncResult(() => db.save(viewType, view.value as View))
          if (!saved.ok) {
            return err({
              code: 'SAVE_VIEW_FAILED',
              message: `Save view failed: ${viewType}#${id} event: ${event.event.type} v${event.version}`
            })
          }

          continue
        }

        if ('deleteId' in def) {
          const id: string = def.deleteId(event)
          const deleted = await toAsyncResult(() => db.delete(viewType, id))
          if (!deleted.ok) {
            return err({
              code: 'DELETE_VIEW_FAILED',
              message: `Delete view failed: ${viewType}#${id} event: ${event.event.type} v${event.version}`
            })
          }
        }
      }

      return ok(undefined)
    }
  }
}
