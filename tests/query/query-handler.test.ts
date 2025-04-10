import { beforeEach, describe, expect, test } from 'bun:test'
import { createQueryHandler, createValidationError } from '../../src'
import type { Query } from '../../src'

interface TestData {
  id: string
  name: string
  age?: number
}

describe('QueryHandler', () => {
  let queryHandler: ReturnType<typeof createQueryHandler<TestData | null>>
  let mockDataStore: Map<string, TestData>

  beforeEach(() => {
    mockDataStore = new Map()
    queryHandler = createQueryHandler<TestData | null>(
      'get',
      async (query: Query) => {
        const id = query.entityId
        if (!id) {
          throw createValidationError('Entity ID is required')
        }
        return { data: mockDataStore.get(id) ?? null }
      }
    )
  })

  test('should return correct data for valid query', async () => {
    const testData: TestData = { id: '1', name: 'test' }
    mockDataStore.set('1', testData)

    const result = await queryHandler({ operation: 'get', entityId: '1' })
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toEqual({ data: testData })
    }
  })

  test('should handle missing data gracefully', async () => {
    const result = await queryHandler({
      operation: 'get',
      entityId: 'non-existent'
    })
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toEqual({ data: null })
    }
  })

  test('should handle getAll query', async () => {
    const testData: TestData[] = [
      { id: '1', name: 'test1' },
      { id: '2', name: 'test2' }
    ]

    for (const data of testData) {
      mockDataStore.set(data.id, data)
    }

    const getAllHandler = createQueryHandler<TestData[]>('getAll', async () => {
      return { data: Array.from(mockDataStore.values()) }
    })

    const result = await getAllHandler({ operation: 'getAll' })
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toEqual({ data: testData })
    }
  })

  test('should handle missing handler error', async () => {
    const result = await queryHandler({
      operation: 'unknown',
      entityId: '1'
    })
    expect(result.isErr()).toBe(true)
  })

  test('should handle duplicate handler registration', async () => {
    const handler1 = createQueryHandler<TestData>('get', async () => ({
      data: { id: '1', name: 'test' }
    }))
    const handler2 = createQueryHandler<TestData>('get', async () => ({
      data: { id: '2', name: 'test2' }
    }))

    const result1 = await handler1({ operation: 'get', entityId: '1' })
    const result2 = await handler2({ operation: 'get', entityId: '1' })

    expect(result1.isOk()).toBe(true)
    expect(result2.isOk()).toBe(true)
    if (result1.isOk() && result2.isOk()) {
      expect(result1.value).not.toEqual(result2.value)
    }
  })

  test('should handle invalid operation names', async () => {
    const result = await queryHandler({
      operation: 'invalid-operation',
      entityId: '1'
    })
    expect(result.isErr()).toBe(true)
  })

  test('should handle query validation errors', async () => {
    const validationHandler = createQueryHandler<TestData>(
      'get',
      async query => {
        if (!query.entityId) {
          throw createValidationError('Entity ID is required')
        }
        return { data: { id: query.entityId, name: 'test' } }
      }
    )

    const result = await validationHandler({
      operation: 'get',
      entityId: ''
    })
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('ValidationError')
    }
  })

  test('should handle database errors', async () => {
    const errorHandler = createQueryHandler<TestData>('get', async () => {
      throw new Error('Database connection failed')
    })

    const result = await errorHandler({ operation: 'get', entityId: '1' })
    expect(result.isErr()).toBe(true)
  })

  test('should handle timeout errors', async () => {
    const timeoutHandler = createQueryHandler<TestData>('get', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      throw new Error('Request timeout')
    })

    const result = await timeoutHandler({ operation: 'get', entityId: '1' })
    expect(result.isErr()).toBe(true)
  })

  test('should handle aggregate queries', async () => {
    const testData: TestData[] = [
      { id: '1', name: 'test1', age: 20 },
      { id: '2', name: 'test2', age: 30 },
      { id: '3', name: 'test3', age: 25 }
    ]

    for (const data of testData) {
      mockDataStore.set(data.id, data)
    }

    const aggregateHandler = createQueryHandler<{ averageAge: number }>(
      'aggregate',
      async () => {
        const ages = Array.from(mockDataStore.values()).map(d => d.age ?? 0)
        const averageAge = ages.reduce((a, b) => a + b, 0) / ages.length
        return { data: { averageAge } }
      }
    )

    const result = await aggregateHandler({ operation: 'aggregate' })
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.data.averageAge).toBe(25)
    }
  })

  test('should handle complex query parameters', async () => {
    const testData: TestData[] = [
      { id: '1', name: 'test1', age: 20 },
      { id: '2', name: 'test2', age: 30 },
      { id: '3', name: 'test3', age: 25 }
    ]

    for (const data of testData) {
      mockDataStore.set(data.id, data)
    }

    const complexHandler = createQueryHandler<TestData[]>(
      'complex',
      async query => {
        const { minAge, maxAge } = query.params as {
          minAge: number
          maxAge: number
        }
        const filtered = Array.from(mockDataStore.values()).filter(
          d => (d.age ?? 0) >= minAge && (d.age ?? 0) <= maxAge
        )
        return { data: filtered }
      }
    )

    const result = await complexHandler({
      operation: 'complex',
      params: { minAge: 20, maxAge: 25 }
    })
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.data.length).toBe(2)
    }
  })

  test('should handle query pagination', async () => {
    const testData: TestData[] = Array.from({ length: 20 }, (_, i) => ({
      id: String(i + 1),
      name: `test${i + 1}`
    }))

    for (const data of testData) {
      mockDataStore.set(data.id, data)
    }

    const paginatedHandler = createQueryHandler<{
      items: TestData[]
      total: number
    }>('paginated', async query => {
      const { page = 1, limit = 10 } = query.params as {
        page: number
        limit: number
      }
      const items = Array.from(mockDataStore.values()).slice(
        (page - 1) * limit,
        page * limit
      )
      return { data: { items, total: mockDataStore.size } }
    })

    const result = await paginatedHandler({
      operation: 'paginated',
      params: { page: 2, limit: 5 }
    })
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.data.items.length).toBe(5)
      expect(result.value.data.total).toBe(20)
    }
  })
})
