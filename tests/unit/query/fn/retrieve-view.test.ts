import { describe, expect, it } from 'bun:test'
import { createRetrieveViewFnFactory } from '../../../../src/query/fn/retrieve-view'
import { ReadDatabaseInMemory, err } from '../../../../src/utils'
import type { CounterListQuery } from '../../../fixtures/query/counter'
import { counterResolver } from '../../../fixtures/query/counter'
import type { CounterView } from '../../../fixtures/view'

describe('retrieve view function', () => {
  it('should return ok when view is retrieved', async () => {
    // Arrange
    const db = new ReadDatabaseInMemory()
    db.save('counter', { type: 'counter', id: '1', count: 1 } as CounterView)
    const retrieveFn = createRetrieveViewFnFactory(counterResolver.resolver)({ readDatabase: db })
    const query: CounterListQuery = {
      operation: 'counterList',
      options: { limit: 10 }
    }

    // Act
    const res = await retrieveFn(query)

    // Assert
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.value.counterList).toEqual([{ type: 'counter', id: '1', count: 1 } as CounterView])
    }
  })

  it('should return ok when view is empty', async () => {
    // Arrange
    const db = new ReadDatabaseInMemory()
    const retrieveFn = createRetrieveViewFnFactory(counterResolver.resolver)({ readDatabase: db })
    const query: CounterListQuery = {
      operation: 'counterList',
      options: { limit: 10 }
    }

    // Act
    const res = await retrieveFn(query)

    // Assert
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.value.counterList).toEqual([])
    }
  })

  it('should return error when operation is unknown', async () => {
    // Arrange
    const db = new ReadDatabaseInMemory()
    const retrieveFn = createRetrieveViewFnFactory(counterResolver.resolver)({ readDatabase: db })
    const query = { operation: 'unknown' }

    // Act
    const res = await retrieveFn(query)
    console.log(res.ok)

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('INVALID_OPERATION')
    }
  })

  it('should return error when view is not found', async () => {
    // Arrange
    const db = new ReadDatabaseInMemory()
    const retrieveFn = createRetrieveViewFnFactory(counterResolver.resolver)({ readDatabase: db })
    const query = { operation: 'counter' }

    // Act
    const res = await retrieveFn(query)

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('INVALID_QUERY')
    }
  })

  it('should return error when view list is not found', async () => {
    // Arrange
    const db = new ReadDatabaseInMemory()
    db.getList = async () => err({ code: 'test', message: '' })
    const retrieveFn = createRetrieveViewFnFactory(counterResolver.resolver)({ readDatabase: db })
    const query = { operation: 'counterList', options: { limit: 10 } }

    // Act
    const res = await retrieveFn(query)

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('READ_DATABASE_ERROR')
      expect(res.error.message).toBe('Failed to retrieve view list')
    }
  })

  it('should return error when retrieving view list throws error', async () => {
    // Arrange
    const db = new ReadDatabaseInMemory()
    db.getList = async () => {
      throw new Error('test')
    }
    const retrieveFn = createRetrieveViewFnFactory(counterResolver.resolver)({ readDatabase: db })
    const query = { operation: 'counterList', options: { limit: 10 } }

    // Act
    const res = await retrieveFn(query)

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('READ_DATABASE_ERROR')
      expect(res.error.message).toBe('Failed to retrieve view list')
    }
  })

  it('should return error when view is not found by id', async () => {
    // Arrange
    const db = new ReadDatabaseInMemory()
    const retrieveFn = createRetrieveViewFnFactory(counterResolver.resolver)({ readDatabase: db })
    const query = { operation: 'counter', id: '1' }

    // Act
    const res = await retrieveFn(query)

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('READ_DATABASE_ERROR')
      expect(res.error.message).toBe('Failed to retrieve view by id')
    }
  })

  it('should return error when retrieving view by id throws error', async () => {
    // Arrange
    const db = new ReadDatabaseInMemory()
    db.getById = async () => {
      throw new Error('test')
    }
    const retrieveFn = createRetrieveViewFnFactory(counterResolver.resolver)({ readDatabase: db })
    const query = { operation: 'counter', id: '1' }

    // Act
    const res = await retrieveFn(query)

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('READ_DATABASE_ERROR')
      expect(res.error.message).toBe('Failed to retrieve view by id')
    }
  })
})
