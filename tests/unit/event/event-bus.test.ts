import { describe, expect, it } from 'bun:test'
import { createEventBus } from '../../../src/event/event-bus'
import { ReadDatabaseInMemory } from '../../../src/utils'
import { counterReactor } from '../../data/command/counter'

describe('event bus', () => {
  describe('event', () => {
    it('should return ok when event is received', async () => {
      // Arrange
      const deps = {
        eventDispatcher: { dispatch: async _ => Promise.resolve() },
        readDatabase: new ReadDatabaseInMemory()
      }
      const receive = createEventBus({ deps, reactors: [counterReactor] })

      // Act
      const res = await receive({
        event: { type: 'created' },
        aggregateId: { type: 'counter', id: '1' },
        version: 1,
        timestamp: new Date()
      })

      // Assert
      expect(res.ok).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should return error if handler is not found', async () => {
      // Arrange
      const deps = {
        eventDispatcher: { dispatch: async _ => Promise.resolve() },
        readDatabase: new ReadDatabaseInMemory()
      }
      const receive = createEventBus({ deps, reactors: [counterReactor] })

      // Act
      const result = await receive({
        event: { type: 'counter' },
        aggregateId: { type: 'unknown', id: '1' },
        version: 1,
        timestamp: new Date()
      })

      // Assert
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('EVENT_HANDLER_NOT_FOUND')
      }
    })

    it('should return error if handler failed', async () => {
      // Arrange
      const deps = {
        eventDispatcher: {
          dispatch: async _ => {
            throw new Error('test')
          }
        },
        readDatabase: new ReadDatabaseInMemory()
      }
      const receive = createEventBus({ deps, reactors: [counterReactor] })

      // Act
      const result = await receive({
        event: { type: 'created' },
        aggregateId: { type: 'counter', id: '1' },
        version: 1,
        timestamp: new Date()
      })

      // Assert
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('COMMAND_DISPATCH_FAILED')
      }
    })
  })
})
