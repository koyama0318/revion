import { describe, expect, it } from 'bun:test'
import { FakeHandler } from '../../src/fixture/fake-handler'
import { zeroId } from '../../src/utils/aggregate-id'
import { counterReactor } from '../data/command/counter'
import { counter } from '../data/command/counter'
import { type CounterQuery, type QueryMap, counterResolver } from '../data/query/counter'

describe('fake handler', () => {
  it('should return ok when command and query are received', async () => {
    // Arrange
    const fakeHandler = new FakeHandler({
      aggregates: [counter],
      reactors: [counterReactor],
      resolvers: [counterResolver],
      config: {
        ignoreViewProjection: true
      }
    })
    const command = {
      operation: 'create',
      id: { type: 'counter', id: '00000000-0000-0000-0000-000000000000' }
    }
    const query = {
      operation: 'counterList',
      options: { limit: 10 }
    }

    // Act
    const commandResult = await fakeHandler.command(command)
    const queryResult = await fakeHandler.query(query)

    // Assert
    expect(commandResult.ok).toBe(true)
    expect(queryResult.ok).toBe(true)
    expect(fakeHandler.eventStore.events).toEqual([
      {
        event: { type: 'created' },
        aggregateId: { type: 'counter', id: expect.any(String) },
        version: 1,
        timestamp: expect.any(Date)
      },
      {
        event: { type: 'incremented' },
        aggregateId: { type: 'counter', id: expect.any(String) },
        version: 2,
        timestamp: expect.any(Date)
      }
    ])
    expect(fakeHandler.readDatabase.storage.counter).toBeDefined()
    if (queryResult.ok) {
      expect(queryResult.value.counterList).toEqual([
        { count: 1, id: expect.any(String), type: 'counter' }
      ])
    }
  })

  it('should return error if command dispatch fails after the aggregate has been deleted', async () => {
    // Arrange
    const fakeHandler = new FakeHandler({
      aggregates: [counter],
      reactors: [counterReactor],
      resolvers: [counterResolver]
    })

    // Act
    const commandResult1 = await fakeHandler.command({
      operation: 'create',
      id: zeroId('counter')
    })
    const id = commandResult1.ok ? commandResult1.value.id.id : ''
    const queryResult1 = await fakeHandler.query<CounterQuery, QueryMap>({
      operation: 'counter',
      id: id
    })

    const commandResult2 = await fakeHandler.command({
      operation: 'delete',
      id: { type: 'counter', id }
    })
    const queryResult2 = await fakeHandler.query<CounterQuery, QueryMap>({
      operation: 'counter',
      id
    })

    const commandResult3 = await fakeHandler.command({
      operation: 'increment',
      id: { type: 'counter', id }
    })
    const queryResult3 = await fakeHandler.query<CounterQuery, QueryMap>({
      operation: 'counter',
      id
    })

    // Assert
    expect(commandResult1.ok).toBe(true)
    expect(id).not.toBeEmpty()
    expect(queryResult1.ok).toBe(true)
    if (queryResult1.ok) {
      expect(queryResult1.value.counter).toEqual({
        count: 1,
        id: expect.any(String),
        type: 'counter'
      })
    }

    expect(commandResult2.ok).toBe(true)
    expect(queryResult2.ok).toBe(false)
    if (!queryResult2.ok) {
      expect(queryResult2.error.code).toBe('VIEW_NOT_FOUND')
    }

    expect(commandResult3.ok).toBe(false)
    expect(queryResult3.ok).toBe(false)
    if (!queryResult3.ok) {
      expect(queryResult3.error.code).toBe('VIEW_NOT_FOUND')
    }
  })
})
