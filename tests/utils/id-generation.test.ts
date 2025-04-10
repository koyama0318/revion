import { describe, expect, test } from 'bun:test'
import { generateUuid } from '../../src'

describe('IdGenerator', () => {
  test('should generate unique IDs', () => {
    const ids = new Set()
    const iterations = 1000

    for (let i = 0; i < iterations; i++) {
      const id = generateUuid()
      ids.add(id)
    }

    expect(ids.size).toBe(iterations)
  })

  test('should validate ID format', () => {
    const id = generateUuid()
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  test('should be performant', () => {
    const start = performance.now()
    const iterations = 10000

    for (let i = 0; i < iterations; i++) {
      generateUuid()
    }

    const end = performance.now()
    const duration = end - start

    // 10000個のID生成が1秒以内に完了することを確認
    expect(duration).toBeLessThan(1000)
  })
})
