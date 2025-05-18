import { describe, expect, it } from 'bun:test'
import { createEventHandlers } from '../../../src/event/event-handler'
import type { ExtendedDomainEvent } from '../../../src/types'
import { ReadDatabaseInMemory, err, ok } from '../../../src/utils'
import { type CounterEvent, counterReactor } from '../../fixtures/command/counter'

describe('event handler', () => {
  describe('initialize', () => {
    it('should create event handler', async () => {
      // Arrange
      const deps = {
        eventDispatcher: { dispatch: async _ => ok(undefined) },
        readDatabase: new ReadDatabaseInMemory()
      }

      // Act
      const handlers = createEventHandlers(deps, [counterReactor])

      // Assert
      expect(handlers).toBeDefined()
    })
  })

  describe('when event is received', () => {
    it('should return ok if event is valid', async () => {
      // Arrange
      const deps = {
        eventDispatcher: { dispatch: async _ => ok(undefined) },
        readDatabase: new ReadDatabaseInMemory()
      }
      const handlers = createEventHandlers(deps, [counterReactor])
      const event = {
        event: { type: 'created' },
        aggregateId: { type: 'counter', id: '1' },
        version: 1,
        timestamp: new Date()
      } as ExtendedDomainEvent<CounterEvent>

      // Act
      const res = await handlers[event.aggregateId.type](event)

      // Assert
      expect(res.ok).toBe(true)
    })
  })

  it('should return error if projection failed', async () => {
    // Arrange
    const deps = {
      eventDispatcher: { dispatch: async _ => ok(undefined) },
      readDatabase: new ReadDatabaseInMemory()
    }
    deps.readDatabase.save = async _ => err({ code: 'READ_DB_ERROR', message: 'test' })
    const handlers = createEventHandlers(deps, [counterReactor])
    const event = {
      event: { type: 'created' },
      aggregateId: { type: 'counter', id: '1' },
      version: 1,
      timestamp: new Date()
    } as ExtendedDomainEvent<CounterEvent>

    // Act
    const res = await handlers[event.aggregateId.type](event)

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('READ_DB_ERROR')
    }
  })

  it('should return error if event dispatch failed', async () => {
    // Arrange
    const deps = {
      eventDispatcher: {
        dispatch: async _ => err({ code: 'EVENT_DISPATCH_ERROR', message: 'test' })
      },
      readDatabase: new ReadDatabaseInMemory()
    }
    const handlers = createEventHandlers(deps, [counterReactor])
    const event = {
      event: { type: 'created' },
      aggregateId: { type: 'counter', id: '1' },
      version: 1,
      timestamp: new Date()
    } as ExtendedDomainEvent<CounterEvent>

    // Act
    const res = await handlers[event.aggregateId.type](event)

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('EVENT_DISPATCH_ERROR')
    }
  })
})
