import { describe, expect, it } from 'bun:test'
import { EventStoreInMemory, createCommandBus } from '../../../src'
import type { CommandHandlerMiddleware } from '../../../src/command/command-bus'
import { counter } from '../../data/command/counter'
import { mergeCounter } from '../../data/command/mergeCounter'

describe('command bus', () => {
  describe('command', () => {
    it('should return ok when command is dispatched', async () => {
      // Arrange
      const deps = { eventStore: new EventStoreInMemory() }
      const dispatch = createCommandBus({ deps, aggregates: [counter] })

      // Act
      const res = await dispatch({
        operation: 'increment',
        id: { type: 'counter', id: '00000000-0000-0000-0000-000000000000' }
      })

      // Assert
      expect(res.ok).toBe(true)
    })

    it('should return ok when domain service command is dispatched', async () => {
      // Arrange
      const es = new EventStoreInMemory()
      es.events.push({
        aggregateId: { type: 'counter', id: '00000000-0000-0000-0000-000000000001' },
        version: 1,
        event: { type: 'incremented' },
        timestamp: new Date()
      })
      es.events.push({
        aggregateId: { type: 'counter', id: '00000000-0000-0000-0000-000000000002' },
        version: 1,
        event: { type: 'incremented' },
        timestamp: new Date()
      })
      const deps = { eventStore: es }
      const dispatch = createCommandBus({ deps, aggregates: [counter], services: [mergeCounter] })

      // Act
      const result = await dispatch({
        operation: 'mergeCounter',
        id: { type: 'mergeCounter', id: '00000000-0000-0000-0000-000000000000' },
        payload: {
          fromCounterId: { type: 'counter', id: '00000000-0000-0000-0000-000000000001' },
          toCounterId: { type: 'counter', id: '00000000-0000-0000-0000-000000000002' }
        }
      })

      // Assert
      expect(result.ok).toBe(true)
    })

    it('should return ok when command is dispatched with middleware', async () => {
      // Arrange
      const order: string[] = []
      const middleware1: CommandHandlerMiddleware = (cmd, next) => {
        order.push('middleware1')
        return next(cmd)
      }
      const middleware2: CommandHandlerMiddleware = (cmd, next) => {
        order.push('middleware2')
        return next(cmd)
      }

      const deps = { eventStore: new EventStoreInMemory() }
      const bus = createCommandBus({
        deps,
        aggregates: [counter],
        middleware: [middleware1, middleware2]
      })

      // Act
      const result = await bus({
        operation: 'increment',
        id: { type: 'counter', id: '00000000-0000-0000-0000-000000000000' }
      })

      // Assert
      expect(result.ok).toBe(true)
      expect(order).toEqual(['middleware1', 'middleware2'])
    })
  })

  describe('error handling', () => {
    it('should return error if operation is invalid', async () => {
      // Arrange
      const deps = { eventStore: new EventStoreInMemory() }
      const dispatch = createCommandBus({ deps, aggregates: [counter] })

      // Act
      const result = await dispatch({
        operation: '',
        id: { type: 'counter', id: '00000000-0000-0000-0000-000000000001' }
      })

      // Assert
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_OPERATION')
      }
    })

    it('should return error if aggregate id is invalid', async () => {
      // Arrange
      const deps = { eventStore: new EventStoreInMemory() }
      const dispatch = createCommandBus({ deps, aggregates: [counter] })

      // Act
      const result = await dispatch({
        operation: 'increment',
        id: { type: 'counter', id: '' }
      })

      // Assert
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_AGGREGATE_ID')
      }
    })

    it('should return error if handler is not found', async () => {
      // Arrange
      const deps = { eventStore: new EventStoreInMemory() }
      const dispatch = createCommandBus({ deps, aggregates: [counter] })

      // Act
      const result = await dispatch({
        operation: 'increment',
        id: { type: 'unknown', id: '00000000-0000-0000-0000-000000000001' }
      })

      // Assert
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('COMMAND_HANDLER_NOT_FOUND')
      }
    })
  })
})
