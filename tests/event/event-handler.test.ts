import { describe, expect, it } from 'bun:test'
import type { ExtendedDomainEvent } from '../../src'
import { ReadDatabaseInMemory, id } from '../../src'
import { createEventHandlers } from '../../src/event/event-handler'
import { type CounterEvent, counterReactor } from '../data/command/counter'
import type { CounterView } from '../data/query/view'

describe('event handler', () => {
  describe('initialize', () => {
    it('should create event handler', async () => {
      // Arrange
      const deps = {
        commandDispatcher: { dispatch: async _ => Promise.resolve() },
        readDatabase: new ReadDatabaseInMemory()
      }

      // Act
      const handlers = createEventHandlers(deps, [counterReactor])

      // Assert
      expect(handlers).toBeDefined()
    })
  })

  describe('when event is received and initialize a view', () => {
    it('should return ok if created event is valid', async () => {
      // Arrange
      const deps = {
        commandDispatcher: { dispatch: async _ => Promise.resolve() },
        readDatabase: new ReadDatabaseInMemory()
      }
      const handlers = createEventHandlers(deps, [counterReactor])
      const event = {
        event: { type: 'created' },
        aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
        version: 1,
        timestamp: new Date()
      } as ExtendedDomainEvent<CounterEvent>

      // Act
      const res = await handlers[event.aggregateId.type](event)

      // Assert
      expect(res.ok).toBe(true)
    })

    it('should return an error if the initial projection fails when getting a view', async () => {
      // Arrange
      const db = new ReadDatabaseInMemory()
      db.getById = async _ => {
        throw new Error('test')
      }
      const deps = {
        commandDispatcher: { dispatch: async _ => Promise.resolve() },
        readDatabase: db
      }
      const handlers = createEventHandlers(deps, [counterReactor])
      const event = {
        event: { type: 'created' },
        aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
        version: 1,
        timestamp: new Date()
      } as ExtendedDomainEvent<CounterEvent>

      // Act
      const res = await handlers[event.aggregateId.type](event)

      // Assert
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.error.code).toBe('GET_VIEW_FAILED')
      }
    })

    it('should return an error if the initial projection fails when a view already exists', async () => {
      // Arrange
      const db = new ReadDatabaseInMemory()
      db.save('counter', {
        type: 'counter',
        id: '00000000-0000-0000-0000-000000000001',
        count: 0
      } as CounterView)
      const deps = {
        commandDispatcher: { dispatch: async _ => Promise.resolve() },
        readDatabase: db
      }
      const handlers = createEventHandlers(deps, [counterReactor])
      const event = {
        event: { type: 'created' },
        aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
        version: 1,
        timestamp: new Date()
      } as ExtendedDomainEvent<CounterEvent>

      // Act
      const res = await handlers[event.aggregateId.type](event)

      // Assert
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.error.code).toBe('VIEW_ALREADY_EXISTS')
      }
    })

    it('should return an error if the initial projection fails when saving a view', async () => {
      // Arrange
      const deps = {
        commandDispatcher: { dispatch: async _ => Promise.resolve() },
        readDatabase: new ReadDatabaseInMemory()
      }
      deps.readDatabase.save = async _ => {
        throw new Error('test')
      }
      const handlers = createEventHandlers(deps, [counterReactor])
      const event = {
        event: { type: 'created' },
        aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
        version: 1,
        timestamp: new Date()
      } as ExtendedDomainEvent<CounterEvent>

      // Act
      const res = await handlers[event.aggregateId.type](event)

      // Assert
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.error.code).toBe('SAVE_VIEW_FAILED')
      }
    })
  })

  describe('when event is received and update a view', () => {
    it('should return ok if updated event is valid', async () => {
      // Arrange
      const db = new ReadDatabaseInMemory()
      const deps = {
        commandDispatcher: { dispatch: async _ => Promise.resolve() },
        readDatabase: db
      }
      db.save('counter', {
        type: 'counter',
        id: '00000000-0000-0000-0000-000000000001',
        count: 0
      } as CounterView)
      const handlers = createEventHandlers(deps, [counterReactor])
      const event = {
        event: { type: 'incremented' },
        aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
        version: 1,
        timestamp: new Date()
      } as ExtendedDomainEvent<CounterEvent>

      // Act
      const res = await handlers[event.aggregateId.type](event)

      // Assert
      expect(res.ok).toBe(true)
    })

    it('should return an error if the updated projection fails when getting a view', async () => {
      // Arrange
      const db = new ReadDatabaseInMemory()
      db.save('counter', {
        type: 'counter',
        id: '1',
        count: 0
      } as CounterView)
      db.getById = async _ => {
        throw new Error('test')
      }
      const deps = {
        commandDispatcher: { dispatch: async _ => Promise.resolve() },
        readDatabase: db
      }
      const handlers = createEventHandlers(deps, [counterReactor])
      const event = {
        event: { type: 'incremented' },
        aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
        version: 1,
        timestamp: new Date()
      } as ExtendedDomainEvent<CounterEvent>

      // Act
      const res = await handlers[event.aggregateId.type](event)

      // Assert
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.error.code).toBe('GET_VIEW_FAILED')
      }
    })

    it('should return an error if the updated projection fails when saving a view', async () => {
      // Arrange
      const db = new ReadDatabaseInMemory()
      db.save('counter', {
        type: 'counter',
        id: '00000000-0000-0000-0000-000000000001',
        count: 0
      } as CounterView)
      db.save = async _ => {
        throw new Error('test')
      }
      const deps = {
        commandDispatcher: { dispatch: async _ => Promise.resolve() },
        readDatabase: db
      }
      const handlers = createEventHandlers(deps, [counterReactor])
      const event = {
        event: { type: 'incremented' },
        aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
        version: 1,
        timestamp: new Date()
      } as ExtendedDomainEvent<CounterEvent>

      // Act
      const res = await handlers[event.aggregateId.type](event)

      // Assert
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.error.code).toBe('SAVE_VIEW_FAILED')
      }
    })
  })

  describe('when event is received and delete a view', () => {
    it('should return ok if deleted event is valid', async () => {
      // Arrange
      const db = new ReadDatabaseInMemory()
      db.save('counter', {
        type: 'counter',
        id: '1',
        count: 0
      } as CounterView)
      const deps = {
        commandDispatcher: { dispatch: async _ => Promise.resolve() },
        readDatabase: db
      }
      const handlers = createEventHandlers(deps, [counterReactor])
      const event = {
        event: { type: 'deleted' },
        aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
        version: 1,
        timestamp: new Date()
      } as ExtendedDomainEvent<CounterEvent>

      // Act
      const res = await handlers[event.aggregateId.type](event)

      // Assert
      expect(res.ok).toBe(true)
    })

    it('should return an error if the deleted projection fails when deleting a view', async () => {
      // Arrange
      const db = new ReadDatabaseInMemory()
      db.save('counter', {
        type: 'counter',
        id: '1',
        count: 0
      } as CounterView)
      db.delete = async _ => {
        throw new Error('test')
      }
      const deps = {
        commandDispatcher: { dispatch: async _ => Promise.resolve() },
        readDatabase: db
      }
      const handlers = createEventHandlers(deps, [counterReactor])
      const event = {
        event: { type: 'deleted' },
        aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
        version: 1,
        timestamp: new Date()
      } as ExtendedDomainEvent<CounterEvent>

      // Act
      const res = await handlers[event.aggregateId.type](event)

      // Assert
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.error.code).toBe('DELETE_VIEW_FAILED')
      }
    })
  })

  describe('when event is received and failed to dispatch a command', () => {
    it('should return error if event dispatch failed', async () => {
      // Arrange
      const deps = {
        commandDispatcher: {
          dispatch: async _ => {
            throw new Error('test')
          }
        },
        readDatabase: new ReadDatabaseInMemory()
      }
      const handlers = createEventHandlers(deps, [counterReactor])
      const event = {
        event: { type: 'created' },
        aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
        version: 1,
        timestamp: new Date()
      } as ExtendedDomainEvent<CounterEvent>

      // Act
      const res = await handlers[event.aggregateId.type](event)

      // Assert
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.error.code).toBe('COMMAND_DISPATCH_FAILED')
      }
    })
  })
})
