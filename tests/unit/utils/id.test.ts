import { describe, expect, it } from 'bun:test'
import type { AggregateId } from '../../../src/types'
import { validateAggregateId } from '../../../src/utils'

describe('aggregate id', () => {
  it('should return true for valid aggregate ID', () => {
    const id: AggregateId = { type: 'hoge', id: '12345678-1234-7123-8123-123456789012' }

    const res = validateAggregateId(id)

    expect(res.ok).toBe(true)
  })

  it('should return false for invalid aggregate type', () => {
    const id = { type: '', id: 'invalid-uuid' }

    const res = validateAggregateId(id as AggregateId)

    expect(res.ok).toBe(false)
  })

  it('should return false for invalid aggregate ID', () => {
    const id = { type: 'hoge', id: 'invalid-uuid' }

    const res = validateAggregateId(id as AggregateId)

    expect(res.ok).toBe(false)
  })
})
