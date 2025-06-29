import { describe, expect, it } from 'bun:test'
import { FakeHandler } from '../../src/fixture/fake-handler'
import { id, zeroId } from '../../src'
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
      id: zeroId('counter')
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
    if (commandResult.ok && queryResult.ok) {
      const genId = commandResult.value.id

      expect(fakeHandler.eventStore.events).toEqual([
        {
          event: { type: 'created' },
          aggregateId: genId,
          version: 1,
          timestamp: expect.any(Date)
        },
        {
          event: { type: 'incremented' },
          aggregateId: genId,
          version: 2,
          timestamp: expect.any(Date)
        }
      ])
      expect(fakeHandler.readDatabase.storage.counter).toBeDefined()
      expect(queryResult.value.counterList).toEqual([{ count: 1, id: genId.id, type: 'counter' }])
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
    const commandId = commandResult1.ok ? commandResult1.value.id.id : ''
    const queryResult1 = await fakeHandler.query<CounterQuery, QueryMap>({
      operation: 'counter',
      id: commandId
    })

    const commandResult2 = await fakeHandler.command({
      operation: 'delete',
      id: id('counter', commandId)
    })
    const queryResult2 = await fakeHandler.query<CounterQuery, QueryMap>({
      operation: 'counter',
      id: commandId
    })

    const commandResult3 = await fakeHandler.command({
      operation: 'increment',
      id: id('counter', commandId)
    })
    const queryResult3 = await fakeHandler.query<CounterQuery, QueryMap>({
      operation: 'counter',
      id: commandId
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
