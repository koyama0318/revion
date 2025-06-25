import { v4 as uuidv4 } from 'uuid'
import {
  commandBus,
  queryBus,
  TodoStatus,
  type TodoState,
  type CreateTodoCommand,
  type UpdateTodoCommand,
  type ChangeStatusCommand,
  type DeleteTodoCommand,
  type GetAllTodosQuery,
  type GetTodoByIdQuery,
  type GetTodosByStatusQuery
} from './todo-app'

const TODO_AGGREGATE_TYPE = 'todo'

// HTTP Server using Bun
const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url)
    const method = req.method

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    }

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders })
    }

    try {
      // GET /todos - Get all todos
      if (method === 'GET' && url.pathname === '/todos') {
        const query: GetAllTodosQuery = { operation: 'getAllTodos' }
        const result = await queryBus.dispatch(query)
        return new Response(JSON.stringify(result.data), {
          status: 200,
          headers: corsHeaders
        })
      }

      // GET /todos/:id - Get todo by ID
      if (method === 'GET' && url.pathname.startsWith('/todos/')) {
        const id = url.pathname.split('/')[2]
        const query: GetTodoByIdQuery = {
          operation: 'getTodoById',
          entityId: id
        }
        const result = await queryBus.dispatch(query)
        
        if (!result.data) {
          return new Response(JSON.stringify({ error: 'Todo not found' }), {
            status: 404,
            headers: corsHeaders
          })
        }

        return new Response(JSON.stringify(result.data), {
          status: 200,
          headers: corsHeaders
        })
      }

      // GET /todos/status/:status - Get todos by status
      if (method === 'GET' && url.pathname.startsWith('/todos/status/')) {
        const status = url.pathname.split('/')[3] as TodoStatus
        
        if (!Object.values(TodoStatus).includes(status)) {
          return new Response(JSON.stringify({ error: 'Invalid status' }), {
            status: 400,
            headers: corsHeaders
          })
        }

        const query: GetTodosByStatusQuery = {
          operation: 'getTodosByStatus',
          params: { status }
        }
        const result = await queryBus.dispatch(query)
        return new Response(JSON.stringify(result.data), {
          status: 200,
          headers: corsHeaders
        })
      }

      // POST /todos - Create new todo
      if (method === 'POST' && url.pathname === '/todos') {
        const body = await req.json()
        const todoId = uuidv4()
        
        const command: CreateTodoCommand = {
          commandId: uuidv4(),
          operation: 'create',
          aggregateType: TODO_AGGREGATE_TYPE,
          aggregateId: todoId,
          payload: {
            title: body.title,
            description: body.description || ''
          }
        }

        const result = await commandBus.dispatch(command)
        
        if (result.isErr()) {
          return new Response(JSON.stringify({ error: result.error.message }), {
            status: 400,
            headers: corsHeaders
          })
        }

        // Return the created todo
        const query: GetTodoByIdQuery = {
          operation: 'getTodoById',
          entityId: todoId
        }
        const todoResult = await queryBus.dispatch(query)
        
        return new Response(JSON.stringify(todoResult.data), {
          status: 201,
          headers: corsHeaders
        })
      }

      // PUT /todos/:id - Update todo
      if (method === 'PUT' && url.pathname.startsWith('/todos/')) {
        const id = url.pathname.split('/')[2]
        const body = await req.json()
        
        const command: UpdateTodoCommand = {
          commandId: uuidv4(),
          operation: 'update',
          aggregateType: TODO_AGGREGATE_TYPE,
          aggregateId: id,
          payload: {
            title: body.title,
            description: body.description
          }
        }

        const result = await commandBus.dispatch(command)
        
        if (result.isErr()) {
          return new Response(JSON.stringify({ error: result.error.message }), {
            status: 400,
            headers: corsHeaders
          })
        }

        // Return the updated todo
        const query: GetTodoByIdQuery = {
          operation: 'getTodoById',
          entityId: id
        }
        const todoResult = await queryBus.dispatch(query)
        
        return new Response(JSON.stringify(todoResult.data), {
          status: 200,
          headers: corsHeaders
        })
      }

      // PATCH /todos/:id/status - Change todo status
      if (method === 'PATCH' && url.pathname.includes('/status')) {
        const id = url.pathname.split('/')[2]
        const body = await req.json()
        
        const command: ChangeStatusCommand = {
          commandId: uuidv4(),
          operation: 'changeStatus',
          aggregateType: TODO_AGGREGATE_TYPE,
          aggregateId: id,
          payload: {
            status: body.status
          }
        }

        const result = await commandBus.dispatch(command)
        
        if (result.isErr()) {
          return new Response(JSON.stringify({ error: result.error.message }), {
            status: 400,
            headers: corsHeaders
          })
        }

        // Return the updated todo
        const query: GetTodoByIdQuery = {
          operation: 'getTodoById',
          entityId: id
        }
        const todoResult = await queryBus.dispatch(query)
        
        return new Response(JSON.stringify(todoResult.data), {
          status: 200,
          headers: corsHeaders
        })
      }

      // DELETE /todos/:id - Delete todo
      if (method === 'DELETE' && url.pathname.startsWith('/todos/')) {
        const id = url.pathname.split('/')[2]
        
        const command: DeleteTodoCommand = {
          commandId: uuidv4(),
          operation: 'delete',
          aggregateType: TODO_AGGREGATE_TYPE,
          aggregateId: id,
          payload: {}
        }

        const result = await commandBus.dispatch(command)
        
        if (result.isErr()) {
          return new Response(JSON.stringify({ error: result.error.message }), {
            status: 400,
            headers: corsHeaders
          })
        }

        return new Response(JSON.stringify({ message: 'Todo deleted successfully' }), {
          status: 200,
          headers: corsHeaders
        })
      }

      // GET /health - Health check
      if (method === 'GET' && url.pathname === '/health') {
        return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
          status: 200,
          headers: corsHeaders
        })
      }

      // 404 Not Found
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: corsHeaders
      })

    } catch (error) {
      console.error('Server error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: corsHeaders
      })
    }
  }
})

console.log(`🚀 Todo HTTP Server running on http://localhost:${server.port}`)
console.log('\nAvailable endpoints:')
console.log('GET    /todos                    - Get all todos')
console.log('GET    /todos/:id                - Get todo by ID')
console.log('GET    /todos/status/:status     - Get todos by status')
console.log('POST   /todos                    - Create new todo')
console.log('PUT    /todos/:id                - Update todo')
console.log('PATCH  /todos/:id/status         - Change todo status')
console.log('DELETE /todos/:id                - Delete todo')
console.log('GET    /health                   - Health check')
console.log('\nTodo statuses: pending, in-progress, completed')
console.log('\nExample requests:')
console.log('curl -X POST http://localhost:3000/todos -H "Content-Type: application/json" -d \'{"title":"Test Todo","description":"Test description"}\'')
console.log('curl http://localhost:3000/todos')
console.log('curl -X PATCH http://localhost:3000/todos/{id}/status -H "Content-Type: application/json" -d \'{"status":"completed"}\'')