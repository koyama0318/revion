import { describe, expect, it } from 'bun:test'
import { id } from '../../src'
import { EventStoreInMemory } from '../../src/utils/event-store-in-memory'

const newId = id('counter', '1')

describe('event store in memory', () => {
  describe('getEvents', () => {
    it('should return empty array when no events', async () => {
      const store = new EventStoreInMemory()
      const result = await store.getEvents(newId)
      expect(result).toEqual([])
    })

    it('should return events from version', async () => {
      const store = new EventStoreInMemory()
      const event1 = {
        event: { type: 'created' },
        aggregateId: newId,
        version: 1,
        timestamp: new Date()
      }
      const event2 = {
        event: { type: 'incremented' },
        aggregateId: newId,
        version: 2,
        timestamp: new Date()
      }
      await store.saveEvents([event1, event2])

      const result = await store.getEvents(newId, 2)
      expect(result).toEqual([event2])
    })
  })

  describe('getLastEventVersion', () => {
    it('should return 0 when no events', async () => {
      const store = new EventStoreInMemory()
      const result = await store.getLastEventVersion(newId)
      expect(result).toBe(0)
    })

    it('should return last version', async () => {
      const store = new EventStoreInMemory()
      const event1 = {
        event: { type: 'created' },
        aggregateId: newId,
        version: 1,
        timestamp: new Date()
      }
      const event2 = {
        event: { type: 'incremented' },
        aggregateId: newId,
        version: 2,
        timestamp: new Date()
      }
      await store.saveEvents([event1, event2])

      const result = await store.getLastEventVersion(newId)
      expect(result).toBe(2)
    })
  })

  describe('saveEvents', () => {
    it('should save events', async () => {
      const store = new EventStoreInMemory()
      const event = {
        event: { type: 'created' },
        aggregateId: newId,
        version: 1,
        timestamp: new Date()
      }
      await store.saveEvents([event])

      const result = await store.getEvents(newId)
      expect(result).toEqual([event])
    })
  })

  describe('getSnapshot', () => {
    it('should return null when no snapshot', async () => {
      const store = new EventStoreInMemory()
      const result = await store.getSnapshot(newId)
      expect(result).toBeNull()
    })

    it('should return snapshot', async () => {
      const store = new EventStoreInMemory()
      const snapshot = {
        state: {
          id: newId,
          count: 1
        },
        version: 1,
        timestamp: new Date()
      }
      await store.saveSnapshot(snapshot)

      const result = await store.getSnapshot(newId)
      expect(result).toEqual(snapshot)
    })
  })

  describe('saveSnapshot', () => {
    it('should save snapshot', async () => {
      const store = new EventStoreInMemory()
      const snapshot = {
        state: {
          id: newId,
          count: 1
        },
        version: 1,
        timestamp: new Date()
      }
      await store.saveSnapshot(snapshot)

      const result = await store.getSnapshot(newId)
      expect(result).toEqual(snapshot)
    })
  })
})
