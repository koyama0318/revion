import { describe, expect, it } from 'bun:test'
import type { GetListOptions, View } from '../../src'
import { ReadDatabaseInMemory } from '../../src'
import type { CounterView } from '../data/query/view'

describe('read database in memory', () => {
  describe('getList', () => {
    it('should return empty array when type not found', async () => {
      const db = new ReadDatabaseInMemory()
      const result = await db.getList('counter', {})
      expect(result).toEqual([])
    })

    it('should return filtered and sorted items', async () => {
      const db = new ReadDatabaseInMemory()
      await db.save('counter', { id: '1', type: 'counter', count: 2 } as CounterView)
      await db.save('counter', { id: '2', type: 'counter', count: 1 } as CounterView)
      await db.save('counter', { id: '3', type: 'counter', count: 3 } as CounterView)

      const options: GetListOptions<CounterView> = {
        sortBy: 'count',
        sortOrder: 'asc',
        limit: 2,
        offset: 0
      }
      const result = await db.getList('counter', options as GetListOptions<View>)

      expect(result).toEqual([
        { id: '2', type: 'counter', count: 1 } as CounterView,
        { id: '1', type: 'counter', count: 2 } as CounterView
      ])
    })
  })

  describe('getById', () => {
    it('should return null when item not found', async () => {
      const db = new ReadDatabaseInMemory()
      const result = await db.getById('counter', '1')
      expect(result).toBeNull()
    })

    it('should return item when found', async () => {
      const db = new ReadDatabaseInMemory()
      const item = { id: '1', type: 'counter', count: 1 }
      await db.save('counter', item)
      const result = await db.getById('counter', '1')
      expect(result).toEqual(item)
    })
  })

  describe('save', () => {
    it('should save item', async () => {
      const db = new ReadDatabaseInMemory()
      const item = { id: '1', type: 'counter', count: 1 }
      await db.save('counter', item)
      const result = await db.getById('counter', '1')
      expect(result).toEqual(item)
    })
  })

  describe('delete', () => {
    it('should delete item', async () => {
      const db = new ReadDatabaseInMemory()
      const item = { id: '1', type: 'counter', count: 1 }
      await db.save('counter', item)
      await db.delete('counter', '1')
      const result = await db.getById('counter', '1')
      expect(result).toBeNull()
    })
  })
})
