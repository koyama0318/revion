import { describe, expect, it } from 'bun:test'
import { ReadDatabaseInMemory } from '../../../src'
import { createQueryBus } from '../../../src/query/query-bus'
import { counterResolver } from '../../fixtures/query/counter'

describe('query bus', () => {
  describe('query', () => {
    it('should return ok when query is dispatched', async () => {
      // Arrange
      const deps = { readDatabase: new ReadDatabaseInMemory() }
      const query = createQueryBus(deps, [counterResolver])

      // Act
      const res = await query({ operation: 'counterList', options: { limit: 10 } })

      // Assert
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.value.counterList).toEqual([])
      }
    })
  })

  describe('error handling', () => {
    it('should return error if operation type is duplicated', () => {
      // Arrange
      const deps = { readDatabase: new ReadDatabaseInMemory() }

      // Act, Assert
      expect(() => {
        createQueryBus(deps, [counterResolver, counterResolver])
      }).toThrow('Duplicate query key: counter.counterList, already defined by counter.counterList')
    })

    it('should return error if operation is not found', async () => {
      // Arrange
      const deps = { readDatabase: new ReadDatabaseInMemory() }
      const query = createQueryBus(deps, [counterResolver])

      // Act
      const res = await query({ operation: 'invalid', options: { limit: 10 } })

      // Assert
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.error.code).toBe('QUERY_HANDLER_NOT_FOUND')
      }
    })
  })
})
