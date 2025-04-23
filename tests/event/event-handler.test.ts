import { beforeEach, describe, expect, it } from 'bun:test'
import type { Id } from '../../src/types/id'
import type { ReadStorage } from '../../src/types/read-storage'
import { ReadStorageInMemory } from '../../src/utils/read-storage-in-memory'
import { ok } from '../../src/utils/result'
import { setupProjectionFactory } from '../fixtures/counter-projection'

describe('EventHandler', () => {
  let readStorage: ReadStorage

  beforeEach(() => {
    readStorage = new ReadStorageInMemory()
  })

  it('should call handler if valid event is received', async () => {
    const factory = setupProjectionFactory()
    const handler = factory(readStorage)

    const view = {
      type: 'Counter',
      id: '00000000-0000-0000-0000-000000000001',
      count: 0
    }

    const event = {
      aggregateId: 'Counter#00000000-0000-0000-0000-000000000001' as Id<'Counter'>,
      eventType: 'increment',
      version: 1,
      timestamp: new Date(),
      payload: { amount: 1 }
    }

    await readStorage.save(view)
    const result = await handler(event)

    expect(result).toEqual(ok(undefined))
  })

  it('should return error if read storage fails', async () => {
    const factory = setupProjectionFactory()
    const handler = factory(readStorage)

    const event = {
      aggregateId: 'Counter#1' as Id<'Counter'>,
      eventType: 'increment',
      version: 1,
      timestamp: new Date(),
      payload: { amount: 1 }
    }

    const result = await handler(event)

    expect(result.ok).toBe(false)
  })
})
