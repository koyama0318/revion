import type { ViewMap } from '@view/index'
import type { TodoCommand, TodoEvent } from 'feature/todo/types'
import type { Policy, Projection } from 'revion'
import { createEventReactor } from 'revion'
import type { EventFor } from 'revion/dist/types'

const policy: Policy<TodoCommand, TodoEvent> = {}

const projection: Projection<TodoEvent, ViewMap> = {
  created: {
    todo: {
      init: e => {
        const event = e.event as EventFor<'created', TodoEvent>
        return {
          type: 'todo',
          id: event.id.id,
          parent: { id: null, title: null },
          title: event.title,
          priority: 'none',
          status: 'incomplete',
          dueDate: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    }
  },
  edited: {
    todo: {
      id: e => e.aggregateId.id,
      apply: (e, view) => {
        const event = e.event as EventFor<'edited', TodoEvent>
        view.title = event.title ?? view.title
        view.priority = event.priority ?? view.priority
        view.dueDate = event.dueDate ?? view.dueDate
        view.updatedAt = new Date()
      }
    }
  },
  parentUpdated: {
    todo: {
      id: e => e.aggregateId.id,
      apply: (e, view) => {
        const event = e.event as EventFor<'parentUpdated', TodoEvent>
        view.parent = { id: event.parentId.id, title: event.parentTitle }
        view.updatedAt = new Date()
      }
    }
  },
  statusUpdated: {},
  deleted: {}
}

export const todoReactor = createEventReactor<'todo', TodoCommand, TodoEvent, ViewMap>({
  type: 'todo',
  policy,
  projection
})
