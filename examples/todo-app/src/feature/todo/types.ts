import type { AggregateId } from 'revion'

export type TodoId = AggregateId<'todo'>

export type TodoPriority = 'high' | 'medium' | 'low' | 'none'

export type TodoStatus = 'incomplete' | 'completed'

export type TodoState = {
  type: 'created'
  id: TodoId
  parentId: TodoId | null
  title: string
  priority: TodoPriority
  status: TodoStatus
  dueDate: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export type TodoCommand =
  | {
      operation: 'create'
      id: TodoId
      title: string
    }
  | {
      operation: 'edit'
      id: TodoId
      title?: string
      priority?: TodoPriority
      dueDate?: Date
    }
  | { operation: 'updateStatus'; id: TodoId; status: TodoStatus }
  | { operation: 'delete'; id: TodoId }

export type TodoEvent =
  | {
      type: 'created'
      id: TodoId
      parentId: TodoId | null
      title: string
      priority: TodoPriority
      status: TodoStatus
      dueDate: Date | null
    }
  | {
      type: 'edited'
      id: TodoId
      title?: string
      priority?: TodoPriority
      dueDate?: Date | null
    }
  | { type: 'parentUpdated'; id: TodoId; parentId: TodoId; parentTitle: string }
  | { type: 'statusUpdated'; id: TodoId; status: TodoStatus }
  | { type: 'deleted'; id: TodoId }
