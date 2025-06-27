import { describe, expect, test } from 'bun:test'
import { aggregateFixture, id, zeroId } from '../../../../src'
import { counter } from './aggregate'
import { counterReactor } from './event-reactor'

const uuid1 = '00000000-0000-0000-0000-000000000001'

describe('counter aggregate tests', () => {
  test('create', () => {
    aggregateFixture(counter, counterReactor)
      .when({ operation: 'create', id: zeroId('counter') })
      .then(fixture => {
        fixture.assert(ctx => {
          expect(ctx.error).toBeNull()
          expect(ctx.state.after.count).toBe(0)
          expect(ctx.version.diff).toBe(2)
          expect(ctx.version.latest).toBe(2)
        })
      })
  })

  test('increment and decrement', () => {
    aggregateFixture(counter, counterReactor)
      .givenId(id('counter', uuid1))
      .given({ type: 'created' })
      .given({ type: 'incremented' })
      .given({ type: 'decremented' })
      .when({ operation: 'increment', id: id('counter', uuid1) })
      .then(fixture => {
        fixture.assert(ctx => {
          expect(ctx.error).toBeNull()
          expect(ctx.state.after.count).toBe(1)
          expect(ctx.version.diff).toBe(1)
          expect(ctx.version.latest).toBe(4)
        })
      })

    aggregateFixture(counter, counterReactor)
      .givenId(id('counter', uuid1))
      .givenMany([{ type: 'created' }, { type: 'incremented' }, { type: 'decremented' }])
      .when({ operation: 'increment', id: id('counter', uuid1) })
      .then(fixture => {
        fixture.assert(ctx => {
          expect(ctx.error).toBeNull()
          expect(ctx.state.after.count).toBe(1)
          expect(ctx.version.diff).toBe(1)
          expect(ctx.version.latest).toBe(4)
        })
      })
  })

  test('create and delete', () => {
    aggregateFixture(counter, counterReactor)
      .givenId(id('counter', uuid1))
      .given({ type: 'created' })
      .when({ operation: 'delete', id: id('counter', uuid1) })
      .then(fixture => {
        fixture.assert(ctx => {
          expect(ctx.error).toBeNull()
          expect(ctx.state.after.count).toBe(0)
          expect(ctx.version.diff).toBe(1)
          expect(ctx.version.latest).toBe(2)
        })
      })
  })
})
