import { beforeEach, describe, expect, it } from 'bun:test'
import type { ReadStorage } from '../../src/types/read-storage'
import { ReadStorageInMemory } from '../../src/utils/read-storage-in-memory'
import { ok } from '../../src/utils/result'
import { queryHandler1, queryHandler2 } from '../fixtures/counter'

describe('QueryHandler', () => {
  let readStorage: ReadStorage

  beforeEach(() => {
    readStorage = new ReadStorageInMemory()
  })

  it('should call handler if valid query is received', async () => {
    const handler = queryHandler1(readStorage)

    const view = {
      type: 'Counter',
      id: '00000000-0000-0000-0000-000000000001',
      count: 0
    }
    const query = { type: 'counterList' }
    await readStorage.save(view)
    const result = await handler(query)

    expect(result).toEqual(
      ok({
        counters: [
          {
            type: 'Counter',
            id: '00000000-0000-0000-0000-000000000001',
            count: 0
          }
        ]
      })
    )
  })

  it('should return error if read storage fails', async () => {
    const handler = queryHandler2(readStorage)

    const query = { type: 'invalid' }
    const result = await handler(query)
    expect(result.ok).toBe(false)
  })
})
