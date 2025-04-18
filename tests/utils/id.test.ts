import { beforeEach, describe, expect, it, jest } from 'bun:test'
import { createAggregateId, newAggregateId, parseAggregateId } from '../../src/types/id'

describe('AggregateId', () => {
  describe('newAggregateId', () => {
    it('should create a new aggregate ID with valid format', () => {
      const type = 'user'
      const id = newAggregateId(type)

      expect(id).toMatch(/^user#[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })
  })

  describe('createAggregateId', () => {
    it('should create an aggregate ID with valid UUID', () => {
      const type = 'user'
      const uuid = '12345678-1234-7123-8123-123456789012'
      const id = createAggregateId(type, uuid)

      expect(id).toBe('user#12345678-1234-7123-8123-123456789012')
    })

    it('should throw error for invalid UUID format', () => {
      const type = 'user'
      const invalidUuid = 'invalid-uuid'

      expect(() => createAggregateId(type, invalidUuid)).toThrow('Invalid UUID format')
    })
  })

  describe('parseAggregateId', () => {
    it('should parse valid aggregate ID', () => {
      const id = 'user#12345678-1234-7123-8123-123456789012'
      const result = parseAggregateId(id)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toEqual({
          type: 'user',
          uuid: '12345678-1234-7123-8123-123456789012'
        })
      }
    })

    it('should return error for missing type', () => {
      const id = '#12345678-1234-7123-8123-123456789012'
      const result = parseAggregateId(id)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_AGGREGATE_ID')
      }
    })

    it('should return error for missing UUID', () => {
      const id = 'user#'
      const result = parseAggregateId(id)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_AGGREGATE_ID')
      }
    })

    it('should return error for invalid UUID format', () => {
      const id = 'user#invalid-uuid'
      const result = parseAggregateId(id)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_AGGREGATE_ID')
      }
    })
  })
})
