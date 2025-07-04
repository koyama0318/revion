import { describe, expect, it } from 'bun:test'
import type { ExtendedDomainEvent } from '../../../src'
import { ReadDatabaseInMemory, id } from '../../../src'
import { createProjectEventFnFactory } from '../../../src/event/fn/project-event'
import type { CounterEvent } from '../../data/command/counter'
import { counterReactor } from '../../data/command/counter'
import type { CounterView } from '../../data/query/view'

describe('project event function', () => {
  it('should return ok when created event is generated', async () => {
    // Arrange
    const db = new ReadDatabaseInMemory()
    const eventFn = createProjectEventFnFactory(counterReactor.projection)(db)
    const event = {
      event: { type: 'created' },
      aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
      version: 1,
      timestamp: new Date()
    } as ExtendedDomainEvent<CounterEvent>

    // Act
    const res = await eventFn(event)
    const view = await db.getById('counter', '00000000-0000-0000-0000-000000000001')

    // Assert
    expect(res.ok).toBe(true)
    expect(view).toEqual({
      type: 'counter',
      id: '00000000-0000-0000-0000-000000000001',
      count: 0
    } as CounterView)
  })

  it('should return error when event type is not found', async () => {
    // Arrange
    const db = new ReadDatabaseInMemory()
    const eventFn = createProjectEventFnFactory(counterReactor.projection)(db)
    const event = {
      event: { type: 'unknown' },
      aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
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
      aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
      version: 1,
      timestamp: new Date()
    } as ExtendedDomainEvent<CounterEvent>
    await eventFn(event1)

    const event = {
      event: { type: 'incremented' },
      aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
      version: 2,
      timestamp: new Date()
    } as ExtendedDomainEvent<CounterEvent>

    // Act
    const res = await eventFn(event)
    const view = await db.getById('counter', '00000000-0000-0000-0000-000000000001')

    // Assert
    console.log(res)
    expect(res.ok).toBe(true)
    expect(view).toEqual({
      count: 1,
      type: 'counter',
      id: '00000000-0000-0000-0000-000000000001'
    } as CounterView)
  })

  it('should return ok when deleted event is generated', async () => {
    // Arrange
    const db = new ReadDatabaseInMemory()
    const projectFn = createProjectEventFnFactory(counterReactor.projection)(db)
    const event1 = {
      event: { type: 'created' },
      aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
      version: 1,
      timestamp: new Date()
    } as ExtendedDomainEvent<CounterEvent>
    await projectFn(event1)

    const event = {
      event: { type: 'deleted' },
      aggregateId: id('counter', '00000000-0000-0000-0000-000000000001'),
      version: 2,
      timestamp: new Date()
    } as ExtendedDomainEvent<CounterEvent>

    // Act
    const res = await projectFn(event)

    // Assert
    expect(res.ok).toBe(true)
    expect(await db.getById('counter', '1')).toBeNull()
  })
})
