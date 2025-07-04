# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a CQRS (Command Query Responsibility Segregation) todo application built with TypeScript and the Revion framework. The application demonstrates event sourcing patterns with proper separation of commands, queries, and event handlers.

## Development Commands

```bash
# Install dependencies
bun install

# Run the application
bun run index.ts

# Run tests
bun test

# Run specific test file
bun test src/command/todo/aggregate.test.ts
```

## Architecture

### CQRS Structure
- **Commands** (`src/command/`): Write operations that modify aggregates
- **Queries** (`src/query/`): Read models and view projections
- **Event Handlers** (`src/event-handler/`): Contains policies and projections

### Key Components

#### Aggregates
- `TodoAggregate`: Core business logic for todo operations (create, edit, delete, status updates)
- State management using EventDecider and Reducer patterns from Revion

#### Event Flow
1. Commands are processed by aggregates to produce events
2. Events are handled by reactors containing:
   - **Policies**: Generate new commands based on events
   - **Projections**: Update read models (ViewMap)

#### Type System
- Domain types defined in `types.ts` files within each aggregate
- Strong typing for Commands, Events, and State
- Cross-aggregate references (e.g., TodoState references TagId)

### Import Paths
The project uses TypeScript path mapping:
- `@command/*` → `src/command/*`
- `@query/*` → `src/query/*`  
- `@event-handler/*` → `src/event-handler/*`

### Export Pattern
Each level has an `index.ts` for re-exports:
- Aggregate level: `src/command/todo/index.ts`
- Layer level: `src/command/index.ts`
- Root level: `src/index.ts`

## Key Files

- `src/index.ts`: Main application entry point with FakeHandler setup
- `src/command/todo/aggregate.ts`: Todo aggregate implementation
- `src/event-handler/todo/policy.ts`: Event reactor with policies and projections
- `src/query/types.ts`: View model definitions