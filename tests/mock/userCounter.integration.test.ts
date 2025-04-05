import { describe, expect, test } from 'bun:test'
import type { IntegrationTestCase } from '../../src/types/testCase'
import type { ReadModelRecord } from '../../src/utils/fake/storeInMemory'
import { integrationTest } from '../../src/utils/test/integrationTest'
import { counter, counterListener } from './counter'
import { user, userListener } from './user'
import type { UserCounterReadModel } from './userCounter'

const cases: IntegrationTestCase = {
  commands: [
    {
      type: 'create',
      id: { type: 'user', id: '123' },
      payload: { name: 'John', age: 20 }
    },
    {
      type: 'increment',
      id: { type: 'counter', id: '123' },
      payload: {}
    }
  ],
  events: [
    {
      type: 'created',
      id: { type: 'user', id: '123' },
      payload: { name: 'John', age: 20 },
      timestamp: expect.any(Date),
      version: 1
    },
    {
      type: 'created',
      id: { type: 'counter', id: '123' },
      payload: { value: 0 },
      timestamp: expect.any(Date),
      version: 1
    },
    {
      type: 'added',
      id: { type: 'counter', id: '123' },
      payload: { value: 1, isMax: false },
      timestamp: expect.any(Date),
      version: 2
    },
    {
      type: 'added',
      id: { type: 'counter', id: '123' },
      payload: { value: 1, isMax: false },
      timestamp: expect.any(Date),
      version: 3
    }
  ],
  readModels: [
    {
      type: 'userCounter',
      id: '123',
      data: {
        id: {
          id: '123',
          type: 'userCounter'
        },
        name: 'John',
        age: 20,
        count: 2
      }
    } as ReadModelRecord<UserCounterReadModel>
  ]
}

describe('userCounter integration test with test library', () => {
  test('userCounter', async () => {
    const result = await integrationTest(
      [user, counter],
      [userListener, counterListener],
      cases
    )

    expect(result.actual.events).toEqual(result.expected.events)
    expect(result.actual.readModels).toEqual(result.expected.readModels)
  })
})
