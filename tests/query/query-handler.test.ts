import { describe, expect, it } from 'bun:test'
import { ReadDatabaseInMemory } from '../../src'
import { createQueryHandlers } from '../../src/query/query-handler'
import { type CounterListQuery, counterResolver } from '../data/query/counter'
import type { CounterView } from '../data/query/view'

describe('query handler', () => {
  describe('initialize', () => {
    it('should create query handler', async () => {
      // Arrange
      const deps = { readDatabase: new ReadDatabaseInMemory() }

      // Act
      const queryHandler = createQueryHandlers(deps, [counterResolver])

      // Assert
      expect(queryHandler).toBeDefined()
    })
  })

  describe('when query is received', () => {
    it('should return ok if query is valid', async () => {
      // Arrange
      const deps = { readDatabase: new ReadDatabaseInMemory() }
      const handlers = createQueryHandlers(deps, [counterResolver])
      const query: CounterListQuery = {
        operation: 'counterList',
        options: { limit: 10 }
      }

      // Act
      const key = 'counter'
      const result = await handlers[key](query)

      // Assert
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.counterList).toEqual([])
      }
    })

    it('should return ok if query is valid and not empty', async () => {
      // Arrange
      const db = new ReadDatabaseInMemory()
      await db.save('counter', { type: 'counter', id: '1', count: 1 } as CounterView)
      await db.save('counter', { type: 'counter', id: '2', count: 2 } as CounterView)

      const deps = { readDatabase: db }
      const handlers = createQueryHandlers(deps, [counterResolver])
      const query: CounterListQuery = {
        operation: 'counterList',
        options: { limit: 10 }
      }

      // Act
      const key = 'counter'
      const result = await handlers[key](query)

      // Assert
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.counterList).toEqual([
          { type: 'counter', id: '1', count: 1 },
          { type: 'counter', id: '2', count: 2 }
        ])
      }
    })

    it('should return error if retrieve view failed', async () => {
      // Arrange
      const db = new ReadDatabaseInMemory()
      db.getList = async () => {
        throw new Error('test')
      }
      const deps = { readDatabase: db }
      const handlers = createQueryHandlers(deps, [counterResolver])
      const query: CounterListQuery = {
        operation: 'counterList',
        options: { limit: 10 }
      }

      // Act
      const key = 'counter'
      const result = await handlers[key](query)

      // Assert
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('READ_DATABASE_ERROR')
      }
    })

    it('should return error if retrieve view fn throws error', async () => {
      // Arrange
      const db = new ReadDatabaseInMemory()
      db.getList = async () => {
        throw new Error('retrieve view failed')
      }
      const deps = { readDatabase: db }
      const handlers = createQueryHandlers(deps, [counterResolver])
      const query: CounterListQuery = {
        operation: 'counterList',
        options: { limit: 10 }
      }

      // Act
      const key = 'counter'
      const result = await handlers[key](query)

      // Assert
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('READ_DATABASE_ERROR')
      }
    })
  })
})
