import { describe, expect, it } from 'bun:test'
import { createCommandHandlers } from '../../src/command/command-handler'
import type { Command } from '../../src/types'
import { id, zeroId } from '../../src/types'
import { EventStoreInMemory } from '../../src/utils'
import { counter } from '../data/command/counter'
import { mergeCounter } from '../data/command/mergeCounter'

describe('command handler', () => {
  describe('initialize', () => {
    it('should create command handler and domain service handler', async () => {
      // Arrange
      const deps = { eventStore: new EventStoreInMemory() }

      // Act
      const commandHandler = createCommandHandlers(deps, [counter], [mergeCounter])

      // Assert
      expect(commandHandler).toBeDefined()
    })
  })

  describe('when command is received', () => {
    it('should return ok if command is valid', async () => {
      // Arrange
      const handlers = createCommandHandlers(
        { eventStore: new EventStoreInMemory() },
        [counter],
        [mergeCounter]
      )
      const command: Command = {
        id: zeroId('counter'),
        operation: 'increment'
      }

      // Act
      const result = await handlers[command.id.type](command)

      // Assert
      expect(result.ok).toBe(true)
    })

    it('should return error if replay event failed', async () => {
      // Arrange
      const es = new EventStoreInMemory()
      es.getEvents = async () => {
        throw new Error('replay event failed')
      }
      const handlers = createCommandHandlers({ eventStore: es }, [counter], [mergeCounter])
      const command: Command = {
        id: zeroId('counter'),
        operation: 'invalid-operation'
      }

      // Act
      const result = await handlers[command.id.type](command)

      // Assert
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('EVENT_DECIDER_ERROR')
      }
    })

    it('should return error if apply event failed', async () => {
      // Arrange
      const handlers = createCommandHandlers(
        { eventStore: new EventStoreInMemory() },
        [counter],
        [mergeCounter]
      )
      const command: Command = {
        id: zeroId('counter'),
        operation: 'invalid-operation'
      }

      // Act
      const result = await handlers[command.id.type](command)

      // Assert
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('EVENT_DECIDER_ERROR')
      }
    })

    it('should return error if save event failed', async () => {
      // Arrange
      const es = new EventStoreInMemory()
      es.saveEvents = async () => {
        throw new Error('save event failed')
      }
      const handlers = createCommandHandlers({ eventStore: es }, [counter], [mergeCounter])
      const command: Command = {
        id: id('counter', '00000000-0000-0000-0000-000000000001'),
        operation: 'increment'
      }

      // Act
      const result = await handlers[command.id.type](command)

      // Assert
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('NO_EVENTS_STORED')
      }
    })
  })

  describe('when domain service is called', () => {
    it('should return ok if command is valid', async () => {
      // Arrange
      const es = new EventStoreInMemory()
      es.saveEvents([
        {
          event: { type: 'created' },
          aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
          version: 1,
          timestamp: new Date()
        },
        {
          event: { type: 'created' },
          aggregateId: id('counter', '00000000-0000-0000-0000-000000000002'),
          version: 1,
          timestamp: new Date()
        }
      ])
      const handlers = createCommandHandlers({ eventStore: es }, [counter], [mergeCounter])
      const command = {
        id: id('mergeCounter', '00000000-0000-0000-0000-000000000001'),
        operation: 'mergeCounter',
        payload: {
          fromCounterId: id('counter', '00000000-0000-0000-0000-000000000001'),
          toCounterId: id('counter', '00000000-0000-0000-0000-000000000002')
        }
      }

      // Act
      const result = await handlers[command.id.type](command as Command)

      // Assert
      expect(result.ok).toBe(true)
    })

    it('should return error if command is invalid', async () => {
      // Arrange
      const handlers = createCommandHandlers(
        { eventStore: new EventStoreInMemory() },
        [counter],
        [mergeCounter]
      )
      const command = {
        id: id('mergeCounter', '00000000-0000-0000-0000-000000000001'),
        operation: 'mergeCounter',
        payload: {
          fromCounterId: id('counter', '00000000-0000-0000-0000-000000000001'),
          toCounterId: id('hoge', '00000000-0000-0000-0000-000000000002')
        }
      }

      // Act
      const result = await handlers[command.id.type](command as Command)

      // Assert
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('DOMAIN_SERVICE_ERROR')
      }
    })
  })
})
