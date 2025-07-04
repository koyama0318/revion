import type { EventDecider, Reducer } from 'revion'
import { createAggregate } from 'revion'
import type { TodoCommand, TodoEvent, TodoId, TodoPriority, TodoState, TodoStatus } from './types'

const stateInit = (id: TodoId): TodoState => {
  const now = new Date()
  return {
    type: 'created',
    id,
    parentId: null,
    title: '',
    priority: 'none' as TodoPriority,
    status: 'incomplete' as TodoStatus,
    dueDate: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  }
}

const decider: EventDecider<TodoState, TodoCommand, TodoEvent> = {
  create: (_state, command) => {
    return [
      {
        type: 'created',
        id: command.id,
        parentId: null,
        title: command.title,
        priority: 'none',
        status: 'incomplete',
        dueDate: null
      }
    ]
  },
  edit: (_state, command) => {
    return [
      {
        type: 'edited',
        id: command.id,
        title: command.title,
        priority: command.priority,
        dueDate: command.dueDate
      }
    ]
  },
  updateStatus: (_state, command) => {
    return [
      {
        type: 'statusUpdated',
        id: command.id,
        status: command.status
      }
    ]
  },
  delete: (_state, command) => {
    return [
      {
        type: 'deleted',
        id: command.id
      }
    ]
  }
}

const reducer: Reducer<TodoState, TodoEvent> = {
  created: (state, event) => {
    state.id = event.id
    state.parentId = event.parentId
    state.title = event.title
    state.priority = event.priority
    state.status = event.status
    state.dueDate = event.dueDate
    state.createdAt = new Date()
    state.updatedAt = new Date()
    state.deletedAt = null
  },
  edited: (state, event) => {
    state.title = event.title ?? state.title
    state.priority = event.priority ?? state.priority
    state.dueDate = event.dueDate !== undefined ? event.dueDate : state.dueDate
    state.updatedAt = new Date()
  },
  parentUpdated: (state, event) => {
    state.parentId = event.parentId
    state.updatedAt = new Date()
  },
  statusUpdated: (state, event) => {
    state.status = event.status
    state.updatedAt = new Date()
  },
  deleted: (state, _event) => {
    state.deletedAt = new Date()
    state.updatedAt = new Date()
  }
}

export const todo = createAggregate({
  type: 'todo',
  stateInit,
  decider,
  reducer
})
