import { beforeEach, describe, expect, it } from 'bun:test'
import type { Id } from '../../src/types/id'
import type { ReadStorage } from '../../src/types/read-storage'
import { ReadStorageInMemory } from '../../src/utils/read-storage-in-memory'
import { ok } from '../../src/utils/result'
import { setupProjectionFactory } from '../fixtures/counter-projection'
import { setupQueryHandlerFactory1, setupQueryHandlerFactory2 } from '../fixtures/counter-query'

describe('QueryHandler', () => {
  let readStorage: ReadStorage

  beforeEach(() => {
    readStorage = new ReadStorageInMemory()
  })

  it('should call handler if valid query is received', async () => {
    const factory = setupQueryHandlerFactory1()
    const handler = factory(readStorage)

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
    const factory = setupQueryHandlerFactory2()
    const handler = factory(readStorage)

    const query = { type: 'invalid' }
    const result = await handler(query)
    expect(result.ok).toBe(false)
  })
})
