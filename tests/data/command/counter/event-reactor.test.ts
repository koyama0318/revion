import { describe, expect, test } from 'bun:test'
import { id, reactorFixture } from '../../../../src'
import type { CounterView } from '../../query/view'
import { counterReactor } from './event-reactor'

const uuid1 = '00000000-0000-0000-0000-000000000001'
const date1 = new Date('2021-01-01')

describe('counter reactor tests', () => {
  test('should return ok when receiving counter created event', () => {
    reactorFixture(counterReactor)
      .when({
        event: { type: 'created' },
        aggregateId: id('counter', uuid1),
        version: 0,
        timestamp: date1
      })
      .then(fixture => {
        fixture.assert(ctx => {
          expect(ctx.error).toBeNull()
          expect(ctx.view.after.counter[uuid1]).toEqual({
            type: 'counter',
            id: uuid1,
            count: 0
          } as CounterView)
        })
      })
  })

  test('should return error when receiving counter created event with existing view', () => {
    reactorFixture(counterReactor)
      .given({ type: 'counter', id: uuid1, count: 10 })
      .when({
        event: { type: 'created' },
        aggregateId: id('counter', uuid1),
        version: 1,
        timestamp: date1
      })
      .then(fixture => {
        fixture.assert(ctx => {
          expect(ctx.error?.code).toBe('VIEW_ALREADY_EXISTS')
        })
      })
  })

  test('should return ok when receiving counter incremented event', () => {
    reactorFixture(counterReactor)
      .given({ type: 'counter', id: uuid1, count: 10 })
      .when({
        event: { type: 'incremented' },
        aggregateId: id('counter', uuid1),
        version: 1,
        timestamp: date1
      })
      .then(fixture => {
        fixture.assert(ctx => {
          expect(ctx.error).toBeNull()
          expect(ctx.view.after.counter[uuid1]).toEqual({
            type: 'counter',
            id: uuid1,
            count: 11
          } as CounterView)
        })
      })
  })

  test('should return ok when receiving counter decremented event', () => {
    reactorFixture(counterReactor)
      .given({ type: 'counter', id: uuid1, count: 10 })
      .when({
        event: { type: 'decremented' },
        aggregateId: id('counter', uuid1),
        version: 1,
        timestamp: date1
      })
      .then(fixture => {
        fixture.assert(ctx => {
          expect(ctx.error).toBeNull()
          expect(ctx.view.after.counter[uuid1]).toEqual({
            type: 'counter',
            id: uuid1,
            count: 9
          } as CounterView)
        })
      })
  })

  test('should return ok when receiving counter deleted event', () => {
    reactorFixture(counterReactor)
      .given({ type: 'counter', id: uuid1, count: 10 })
      .when({
        event: { type: 'deleted' },
        aggregateId: id('counter', uuid1),
        version: 1,
        timestamp: date1
      })
      .then(fixture => {
        fixture.assert(ctx => {
          expect(ctx.error).toBeNull()
          expect(ctx.view.after.counter[uuid1]).toBeUndefined()
        })
      })
  })
})
