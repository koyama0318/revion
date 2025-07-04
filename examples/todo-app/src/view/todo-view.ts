export type TodoView = {
  type: 'todo'
  id: string
  parent: {
    id: string | null
    title: string | null
  }
  title: string
  priority: string
  status: string
  dueDate: Date | null
  createdAt: Date
  updatedAt: Date
}
