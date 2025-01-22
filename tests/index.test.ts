import { expect, test } from 'bun:test'
import { hello } from '../src/index'

test('hello', () => {
  expect(hello('world')).toBe('Hello, world!')
})
