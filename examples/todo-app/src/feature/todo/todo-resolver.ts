import type { ViewMap } from '@view/index'
import type { TodoView } from '@view/todo-view'
import { createQueryResolver } from 'revion'
import type { GetListOptions, QueryResolver } from 'revion'

type QueryMap = {
  todoList: {
    query: {
      operation: 'todoList'
      options: GetListOptions<TodoView>
    }
    result: { todoList: TodoView[] }
  }
  todo: {
    query: {
      operation: 'todo'
      id: string
    }
    result: { todo: TodoView }
  }
}

const resolver: QueryResolver<QueryMap, ViewMap> = {
  todoList: {
    todoList: {
      view: 'todo',
      options: q => q.options
    }
  },
  todo: {
    todo: {
      view: 'todo',
      id: q => q.id
    }
  }
}

export const todoResolver = createQueryResolver<'todo', QueryMap, ViewMap>({
  type: 'todo',
  resolver
})
