# Todo App Example

This example demonstrates a complete todo application using the Revion CQRS/Event Sourcing library with Bun backend.

## Features

- **CQRS Pattern**: Commands for mutations, queries for reads
- **Event Sourcing**: All state changes are stored as events
- **Validation**: Zod schema validation for commands
- **Authorization**: Role-based permissions
- **Idempotency**: Duplicate command protection
- **HTTP API**: RESTful endpoints with Bun server

## Architecture

### Commands
- `CreateTodoCommand` - Create a new todo
- `UpdateTodoCommand` - Update todo title/description
- `ChangeStatusCommand` - Change todo status (pending/in-progress/completed)
- `DeleteTodoCommand` - Delete a todo

### Queries
- `GetAllTodosQuery` - Retrieve all todos
- `GetTodoByIdQuery` - Retrieve a specific todo
- `GetTodosByStatusQuery` - Retrieve todos by status

### Events
- `TodoCreated` - When a todo is created
- `TodoUpdated` - When a todo is updated
- `TodoStatusChanged` - When status changes
- `TodoDeleted` - When a todo is deleted

## Running the Examples

### Command-line Example
```bash
bun run example/todo-app.ts
```

### HTTP Server
```bash
bun run example/todo-http-server.ts
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/todos` | Get all todos |
| GET | `/todos/:id` | Get todo by ID |
| GET | `/todos/status/:status` | Get todos by status |
| POST | `/todos` | Create new todo |
| PUT | `/todos/:id` | Update todo |
| PATCH | `/todos/:id/status` | Change todo status |
| DELETE | `/todos/:id` | Delete todo |
| GET | `/health` | Health check |

## Example HTTP Requests

### Create a todo
```bash
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn TypeScript","description":"Study TS fundamentals"}'
```

### Get all todos
```bash
curl http://localhost:3000/todos
```

### Update todo status
```bash
curl -X PATCH http://localhost:3000/todos/{id}/status \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

### Get todos by status
```bash
curl http://localhost:3000/todos/status/completed
```

## Todo Status Values
- `pending` - Not started
- `in-progress` - Currently working on it
- `completed` - Finished

## Key Implementation Details

### Event Store
Uses an in-memory event store that:
- Stores all domain events
- Supports event replay for state reconstruction
- Provides snapshot capabilities
- Includes debugging methods

### Validation
- Zod schemas validate command payloads
- Business rules enforced in the decider
- Authorization checked via middleware

### Middleware Stack
1. **Logging** - Logs all commands
2. **Authorization** - Role-based permissions
3. **Idempotency** - Prevents duplicate commands
4. **Validation** - Schema and business validation

### Error Handling
- Commands return `Result<T, AppError>` types
- Graceful error responses in HTTP API
- Detailed error messages for debugging