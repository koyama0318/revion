import { describe, expect, it } from 'bun:test'
import { err, ok, toAsyncResult, toResult } from '../../src/utils'

describe('Result utilities', () => {
  describe('ok', () => {
    it('should create an Ok result', () => {
      const result = ok(123)
      expect(result).toEqual({ ok: true, value: 123 })
    })
  })

  describe('err', () => {
    it('should create an Err result', () => {
      const error = new Error('fail')
      const result = err(error)
      expect(result).toEqual({ ok: false, error })
    })
  })

  describe('toResult', () => {
    it('should return Ok when function succeeds', () => {
      const result = toResult(() => 42)
      expect(result).toEqual(ok(42))
    })

    it('should return Err when function throws', () => {
      const result = toResult(() => {
        throw new Error('fail')
      })
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error)
        expect(result.error.message).toBe('fail')
      }
    })
  })

  describe('toAsyncResult', () => {
    it('should resolve Ok when async function succeeds', async () => {
      const result = await toAsyncResult(async () => 'done')
      expect(result).toEqual(ok('done'))
    })

    it('should resolve Err when async function throws', async () => {
      const result = await toAsyncResult(async () => {
        throw new Error('async fail')
      })
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error)
        expect(result.error.message).toBe('async fail')
      }
    })
  })
})
