import type {
  AppError,
  AsyncResult,
  DomainEvent,
  ExtendedDomainEvent,
  ProjectionFn,
  ReadDatabase,
  ViewMap
} from '../../types'
import { err, ok } from '../../utils'

export type ProjectEventFn<E extends DomainEvent> = (
  event: ExtendedDomainEvent<E>
) => AsyncResult<void, AppError>

export function createProjectEventFnFactory<E extends DomainEvent, VM extends ViewMap>(
  projection: ProjectionFn<E, VM>
): (db: ReadDatabase) => ProjectEventFn<E> {
  return (db: ReadDatabase) => {
    return async (event: ExtendedDomainEvent<E>) => {
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
          const saved = await db.save(viewType, view)
          if (!saved.ok) return saved

          continue
        }

        if ('id' in def && 'apply' in def) {
          const id: string = def.id(event)
          const view = await db.getById(viewType, id)
          if (!view.ok) return view
          def.apply(event, view.value)
          const saved = await db.save(viewType, view.value)
          if (!saved.ok) return saved

          continue
        }

        if ('deleteId' in def) {
          const id: string = def.deleteId(event)
          const deleted = await db.delete(viewType, id)
          if (!deleted.ok) return deleted
        }
      }

      return ok(undefined)
    }
  }
}
