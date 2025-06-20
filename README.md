# revion

Revion is a library for writing CQRS and Event Sourcing logic in a declarative
way. It provides factories for aggregates, event reactors and query resolvers
that can be composed to build your application.

## Installation

```bash
bun install
```

## Design philosophy

Revion aims to keep CQRS/ES configuration concise. Aggregates, projections and
resolvers are declared as plain objects much like reducers in Zustand or Redux.
This declarative style makes each part of the workflow easy to read and test.

## Example

The following example shows how Revion pieces fit together. Each code block is
described in the text that follows it.

### 1. Declare domain types

```ts
import {
  createAggregate,
  createCommandBus,
  createEventBus,
  createEventReactor,
  createQueryBus,
  createQueryResolver,
  type AggregateId,
  type Projection,
  type Policy,
  EventStoreInMemory,
  ReadDatabaseInMemory
} from 'revion'

type CounterId = AggregateId<'counter'>
type CounterState = { id: CounterId; count: number }

type CounterCommand =
  | { operation: 'create'; id: CounterId }
  | { operation: 'increment'; id: CounterId }
  | { operation: 'decrement'; id: CounterId }
  | { operation: 'delete'; id: CounterId }

type CounterEvent =
  | { type: 'created' }
  | { type: 'incremented' }
  | { type: 'decremented' }
  | { type: 'deleted' }
```

The application starts by declaring identifiers, state, commands and events in
a strongly typed way.

### 2. Aggregate

```ts
const counter = createAggregate({
  type: 'counter',
  stateInit: (id: CounterId): CounterState => ({ id, count: 0 }),
  decider: {
    create: () => ({ type: 'created' }),
    increment: () => ({ type: 'incremented' }),
    decrement: () => ({ type: 'decremented' }),
    delete: () => ({ type: 'deleted' })
  },
  reducer: {
    created: s => { s.count = 0 },
    incremented: s => { s.count += 1 },
    decremented: s => { s.count -= 1 },
    deleted: s => { s.count = 0 }
  }
})
```

The aggregate maps commands to events via the `decider` and updates state with
the `reducer`.

### 3. Projection and policy

```ts
type CounterView = { type: 'counter'; id: string; count: number }
type ViewMap = { counter: CounterView }

const projection: Projection<CounterEvent, ViewMap> = {
  created: {
    counter: {
      init: e => ({ type: 'counter', id: e.aggregateId.id, count: 0 })
    }
  },
  incremented: {
    counter: {
      id: e => e.aggregateId.id,
      apply: (_e, v) => { v.count += 1 }
    }
  },
  decremented: {
    counter: {
      id: e => e.aggregateId.id,
      apply: (_e, v) => { v.count -= 1 }
    }
  },
  deleted: {
    counter: { deleteId: e => e.aggregateId.id }
  }
}

const policy: Policy<CounterCommand, CounterEvent> = {
  created: e => ({ operation: 'increment', id: e.aggregateId as CounterId })
}

const counterReactor = createEventReactor<'counter', CounterCommand, CounterEvent, ViewMap>({
  type: 'counter',
  policy,
  projection
})
```

Event reactors update views using a projection and may emit follow-up commands
defined by the policy.

### 4. Queries

```ts
type CounterListQuery = { operation: 'counterList'; options: { limit?: number } }
type CounterQuery = { operation: 'counter'; id: string }

type QueryMap = {
  counterList: { query: CounterListQuery; result: { counterList: CounterView[] } }
  counter: { query: CounterQuery; result: { counter: CounterView } }
}

const counterResolver = createQueryResolver<'counter', QueryMap, ViewMap>({
  type: 'counter',
  resolver: {
    counterList: { counterList: { view: 'counter', options: q => q.options } },
    counter: { counter: { view: 'counter', id: q => q.id } }
  }
})
```

Queries are resolved declaratively by mapping the request to a view.

### 5. Buses and usage

```ts
const eventStore = new EventStoreInMemory()
const readDb = new ReadDatabaseInMemory()

const commandBus = createCommandBus({ deps: { eventStore }, aggregates: [counter] })

const dispatcher = {
  dispatch: async (command: CounterCommand) => {
    const res = await commandBus(command)
    if (!res.ok) throw new Error(res.error.message)
  }
}

const eventBus = createEventBus({
  deps: { eventDispatcher: dispatcher, readDatabase: readDb },
  reactors: [counterReactor]
})

const queryBus = createQueryBus<QueryMap>({
  deps: { readDatabase: readDb },
  resolvers: [counterResolver]
})

const id: CounterId = { type: 'counter', id: '1' }
await commandBus({ operation: 'create', id })

await eventBus({
  event: { type: 'created' },
  aggregateId: id,
  version: 1,
  timestamp: new Date()
})

const result = await queryBus({ operation: 'counter', id: '1' })
console.log(result)
```

Commands, events and queries flow through the buses, showing how the pieces work
together using the in-memory adapters.
