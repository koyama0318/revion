import { describe, expect, it } from 'bun:test'
import { createProjectEventFnFactory } from '../../../../src/event/fn/project-event'
import type { ExtendedDomainEvent } from '../../../../src/types'
import { ReadDatabaseInMemory } from '../../../../src/utils'
import type { CounterEvent } from '../../../data/command/counter'
import { counterReactor } from '../../../data/command/counter'
import type { CounterView } from '../../../data/view'

describe('project event function', () => {
  it('should return ok when created event is generated', async () => {
    // Arrange
    const db = new ReadDatabaseInMemory()
    const eventFn = createProjectEventFnFactory(counterReactor.projection)(db)
    const event = {
      event: { type: 'created' },
      aggregateId: { type: 'counter', id: '1' },
      version: 1,
      timestamp: new Date()
    } as ExtendedDomainEvent<CounterEvent>

    // Act
    const res = await eventFn(event)
    const view = await db.getById('counter', '1')

    // Assert
    expect(res.ok).toBe(true)
    expect(view).toEqual({ type: 'counter', id: '1', count: 0 } as CounterView)
  })

  it('should return error when event type is not found', async () => {
    // Arrange
    const db = new ReadDatabaseInMemory()
    const eventFn = createProjectEventFnFactory(counterReactor.projection)(db)
    const event = {
      event: { type: 'unknown' },
      aggregateId: { type: 'counter', id: '1' },
      version: 1,
      timestamp: new Date()
    } as unknown as ExtendedDomainEvent<CounterEvent>

    // Act
    const res = await eventFn(event)

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('EVENT_TYPE_NOT_FOUND')
    }
  })

  it('should return ok when updated event is generated', async () => {
    // Arrange
    const db = new ReadDatabaseInMemory()
    const eventFn = createProjectEventFnFactory(counterReactor.projection)(db)
    const event1 = {
      event: { type: 'created' },
      aggregateId: { type: 'counter', id: '1' },
      version: 1,
      timestamp: new Date()
    } as ExtendedDomainEvent<CounterEvent>
    await eventFn(event1)

    const event = {
      event: { type: 'incremented' },
      aggregateId: { type: 'counter', id: '1' },
      version: 2,
      timestamp: new Date()
    } as ExtendedDomainEvent<CounterEvent>

    // Act
    const res = await eventFn(event)
    const view = await db.getById('counter', '1')

    // Assert
    expect(res.ok).toBe(true)
    expect(view).toEqual({ count: 1, type: 'counter', id: '1' } as CounterView)
  })

  it('should return error when deleted event is generated', async () => {
    // Arrange
    const db = new ReadDatabaseInMemory()
    const projectFn = createProjectEventFnFactory(counterReactor.projection)(db)
    const event1 = {
      event: { type: 'created' },
      aggregateId: { type: 'counter', id: '1' },
      version: 1,
      timestamp: new Date()
    } as ExtendedDomainEvent<CounterEvent>
    await projectFn(event1)

    const event = {
      event: { type: 'deleted' },
      aggregateId: { type: 'counter', id: '1' },
      version: 2,
      timestamp: new Date()
    } as ExtendedDomainEvent<CounterEvent>

    // Act
    const res = await projectFn(event)

    // Assert
    expect(res.ok).toBe(true)
    expect(() => db.getById('counter', '1')).toThrow()
  })
})
