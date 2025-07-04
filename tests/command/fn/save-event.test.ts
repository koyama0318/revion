import { describe, expect, it } from 'bun:test'
import { EventStoreInMemory } from '../../../src'
import { createSaveEventFnFactory } from '../../../src/command/fn/save-event'

describe('save event function', () => {
  it('should return ok when events are saved', async () => {
    // Arrange
    const deps = { eventStore: new EventStoreInMemory() }
    const saveEventFn = createSaveEventFnFactory()(deps)

    const state = {
      state: {
        id: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
        count: 0
      },
      version: 1
    }

    const events = [
      {
        event: { type: 'incremented' },
        aggregateId: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
        version: 1,
        timestamp: new Date()
      }
    ]

    // Act
    const res = await saveEventFn(state, events)

    // Assert
    expect(res.ok).toBe(true)
  })

  it('should return ok when snapshot is saved', async () => {
    // Arrange
    const es = new EventStoreInMemory()
    for (let i = 1; i <= 100; i++) {
      es.events.push({
        event: { type: 'incremented' },
        aggregateId: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
        version: i,
        timestamp: new Date()
      })
    }
    const deps = { eventStore: es }
    const saveEventFn = createSaveEventFnFactory()(deps)

    const state = {
      state: {
        id: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
        count: 0
      },
      version: 101
    }

    const event = {
      event: { type: 'incremented' },
      aggregateId: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
      version: 101,
      timestamp: new Date()
    }

    // Act
    const res = await saveEventFn(state, [event])

    // Assert
    expect(res.ok).toBe(true)
  })

  it('should return error when version duplication', async () => {
    // Arrange
    const deps = { eventStore: new EventStoreInMemory() }
    const saveEventFn = createSaveEventFnFactory()(deps)

    const state = {
      state: {
        id: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
        count: 0
      },
      version: 1
    }

    const events = [
      {
        event: { type: 'incremented' },
        aggregateId: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
        version: 1,
        timestamp: new Date()
      },
      {
        event: { type: 'incremented' },
        aggregateId: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
        version: 1,
        timestamp: new Date()
      }
    ]

    // Act
    const res = await saveEventFn(state, events)

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('VERSION_DUPLICATION')
    }
  })

  it('should return error when event version cannot be loaded', async () => {
    // Arrange
    const es = new EventStoreInMemory()
    es.getLastEventVersion = async () => {
      throw new Error('test')
    }
    const deps = { eventStore: es }
    const saveEventFn = createSaveEventFnFactory()(deps)

    const state = {
      state: {
        id: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
        count: 0
      },
      version: 1
    }

    const events = [
      {
        event: { type: 'incremented' },
        aggregateId: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
        version: 1,
        timestamp: new Date()
      }
    ]

    // Act
    const res = await saveEventFn(state, events)

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('LAST_EVENT_VERSION_CANNOT_BE_LOADED')
    }
  })

  it('should return error when event version mismatch', async () => {
    // Arrange
    const deps = { eventStore: new EventStoreInMemory() }
    const saveEventFn = createSaveEventFnFactory()(deps)

    const state = {
      state: {
        id: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
        count: 0
      },
      version: 1
    }

    // Act
    const res = await saveEventFn(state, [])

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('NO_EVENTS_GENERATED')
    }
  })

  it('should return error when event version conflict', async () => {
    // Arrange
    const es = new EventStoreInMemory()
    es.events.push({
      event: { type: 'incremented' },
      aggregateId: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
      version: 1,
      timestamp: new Date()
    })
    const deps = { eventStore: es }
    const saveEventFn = createSaveEventFnFactory()(deps)

    const state = {
      state: {
        id: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
        count: 0
      },
      version: 1
    }

    const events = [
      {
        event: { type: 'incremented' },
        aggregateId: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
        version: 1,
        timestamp: new Date()
      }
    ]

    // Act
    const res = await saveEventFn(state, events)

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('EVENT_VERSION_CONFLICT')
    }
  })

  it('should return error when snapshot cannot be saved', async () => {
    // Arrange
    const es = new EventStoreInMemory()
    for (let i = 1; i <= 100; i++) {
      es.events.push({
        event: { type: 'incremented' },
        aggregateId: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
        version: i,
        timestamp: new Date()
      })
    }
    es.saveSnapshot = async () => {
      throw new Error('test')
    }
    const deps = { eventStore: es }
    const saveEventFn = createSaveEventFnFactory()(deps)

    const state = {
      state: {
        id: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
        count: 0
      },
      version: 101
    }

    const event = {
      event: { type: 'incremented' },
      aggregateId: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
      version: 101,
      timestamp: new Date()
    }

    // Act
    const res = await saveEventFn(state, [event])

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('SNAPSHOT_CANNOT_BE_SAVED')
    }
  })

  it('should return error when events cannot be saved', async () => {
    // Arrange
    const es = new EventStoreInMemory()
    es.saveEvents = async () => {
      throw new Error('test')
    }
    const deps = { eventStore: es }
    const saveEventFn = createSaveEventFnFactory()(deps)

    const state = {
      state: {
        id: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
        count: 0
      },
      version: 1
    }

    const events = [
      {
        event: { type: 'incremented' },
        aggregateId: { type: 'counter', id: '000000000000-0000-0000-0000-00000001' },
        version: 1,
        timestamp: new Date()
      }
    ]

    // Act
    const res = await saveEventFn(state, events)

    // Assert
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('EVENTS_CANNOT_BE_SAVED')
    }
  })
})
