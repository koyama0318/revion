import { describe, expect, it } from 'bun:test'
import { QueryBus } from '../../src/query/query-bus'
import type { Query, QueryHandler } from '../../src/types/query'
import { err, ok } from '../../src/utils/result'
import { queryBus } from '../fixtures/counter-query'

const mockQuery: Query = {
  type: 'test',
  id: 'test#01963f1e-96b3-7000-944d-68549ad889a2'
}

function setupHandlers(): Record<string, QueryHandler> {
  return { test: async _ => ok({ type: 'test' }) }
}

describe('QueryBus integration', () => {
  it('should call handler if valid query is dispatched', async () => {
    const result1 = await queryBus.execute({ type: 'counterList' })
    const result2 = await queryBus.execute({
      type: 'counterById',
      id: '00000000-0000-0000-0000-000000000001'
    })

    expect(result1).toEqual(ok({ counters: [] }))
    expect(result2).toEqual(
      err({
        code: 'VIEW_NOT_FOUND',
        message: 'View with id 00000000-0000-0000-0000-000000000001 not found'
      })
    )
  })
})

describe('QueryBus', () => {
  it('should call handler if valid query is dispatched', async () => {
    const bus = new QueryBus(setupHandlers())
    const result = await bus.execute(mockQuery)

    expect(result.ok).toBe(true)
    expect(result).toEqual(ok({ type: 'test' }))
  })

  it('should return error if aggregateId is invalid', async () => {
    const invalidQuery = { ...mockQuery, type: 'invalid' }
    const bus = new QueryBus(setupHandlers())
    const result = await bus.execute(invalidQuery as Query)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('HANDLER_NOT_FOUND')
    }
  })

  it('should return error if handler for aggregate type is not found', async () => {
    const bus = new QueryBus({})
    const result = await bus.execute(mockQuery)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('HANDLER_NOT_FOUND')
    }
  })
})
