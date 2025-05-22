import { beforeEach, describe, expect, it } from 'bun:test'
import { EventStoreInMemory } from '../../../src'
import {
  createCombinedApplyFn,
  createCombinedReplayFn,
  createCombinedSaveFn
} from '../../../src/command/combined'
import type { ExtendedDomainEvent, ExtendedState } from '../../../src/types'
import type { CounterCommand, CounterEvent, CounterState } from '../../data/command/counter'
import { counter } from '../../data/command/counter'

describe('combined', () => {
  let es: EventStoreInMemory

  beforeEach(() => {
    es = new EventStoreInMemory()
  })

  describe('createCombinedReplayFn', () => {
    it('should return ok if aggregate is found', async () => {
      // Arrange
      es.events.push({
        aggregateId: { type: 'counter', id: '00000000-0000-0000-0000-000000000001' },
        version: 1,
        event: { type: 'created' },
        timestamp: new Date()
      })
      const replayFn = createCombinedReplayFn({ eventStore: es }, [counter])

      // Act
      const res = await replayFn({ type: 'counter', id: '00000000-0000-0000-0000-000000000001' })

      // Assert
      expect(res).toBeDefined()
      expect(res).not.toBeNull()
    })

    it('should return null if aggregate is not found', async () => {
      // Arrange
      const replayFn = createCombinedReplayFn({ eventStore: es }, [counter])

      // Act
      const res = await replayFn({ type: 'unknown', id: '00000000-0000-0000-0000-000000000001' })

      // Assert
      expect(res).toBeNull()
    })

    it('should return error if replay event failed', async () => {
      // Arrange
      const replayFn = createCombinedReplayFn({ eventStore: es }, [counter])

      // Act
      const res = await replayFn({ type: 'counter', id: '00000000-0000-0000-0000-000000000001' })

      // Assert
      expect(res).toBeNull()
    })
  })

  describe('createCombinedApplyFn', () => {
    it('should return ok if state and command are id match', async () => {
      // Arrange
      const applyFn = createCombinedApplyFn([counter])
      const state: ExtendedState<CounterState> = {
        state: {
          id: { type: 'counter', id: '00000000-0000-0000-0000-000000000001' },
          count: 0
        },
        version: 1
      }
      const command: CounterCommand = {
        operation: 'increment',
        id: { type: 'counter', id: '00000000-0000-0000-0000-000000000001' }
      }

      // Act
      const res = applyFn(state, command)

      // Assert
      expect(res.state).toBeDefined()
      expect(res.events).toBeDefined()
    })

    it('should return error if state and command are id mismatch', async () => {
      // Arrange
      const applyFn = createCombinedApplyFn([counter])
      const state: ExtendedState<CounterState> = {
        state: {
          id: { type: 'counter', id: '00000000-0000-0000-0000-000000000001' },
          count: 0
        },
        version: 1
      }
      const command = {
        operation: 'increment',
        id: { type: 'unknown', id: '00000000-0000-0000-0000-000000000002' }
      }

      // Assert
      expect(() => applyFn(state, command)).toThrow('state and command are id mismatch')
    })

    it('should return error if aggregate is not found', async () => {
      // Arrange
      const applyFn = createCombinedApplyFn([counter])
      const state = {
        state: {
          id: { type: 'unknown', id: '00000000-0000-0000-0000-000000000001' },
          count: 0
        },
        version: 1
      }
      const command = {
        operation: 'increment',
        id: { type: 'unknown', id: '00000000-0000-0000-0000-000000000001' }
      }

      // Assert
      expect(() => applyFn(state, command)).toThrow('aggregate is not registered')
    })

    it('should return error if apply event failed', async () => {
      // Arrange
      const errAggregate = {
        ...counter,
        eventDecider: () => {
          throw new Error('test')
        }
      }
      const applyFn = createCombinedApplyFn([errAggregate])
      const state: ExtendedState<CounterState> = {
        state: {
          id: { type: 'counter', id: '00000000-0000-0000-0000-000000000001' },
          count: 0
        },
        version: 1
      }
      const command = {
        operation: 'increment',
        id: { type: 'counter', id: '00000000-0000-0000-0000-000000000001' }
      }

      // Assert
      expect(() => applyFn(state, command)).toThrow(
        'state: [object Object], command: [object Object], code: EVENT_DECIDER_ERROR, message: Event decider error'
      )
    })
  })

  describe('createCombinedSaveFn', () => {
    it('should return ok if events are saved', async () => {
      // Arrange
      const saveFn = createCombinedSaveFn({ eventStore: es })
      const state: ExtendedState<CounterState> = {
        state: {
          id: { type: 'counter', id: '00000000-0000-0000-0000-000000000001' },
          count: 0
        },
        version: 1
      }
      const events: ExtendedDomainEvent<CounterEvent>[] = [
        {
          event: { type: 'incremented' },
          aggregateId: { type: 'counter', id: '00000000-0000-0000-0000-000000000001' },
          version: 1,
          timestamp: new Date()
        }
      ]
      // Assert
      expect(() => saveFn(state, events)).not.toThrow()
    })

    it('should return error if save event failed', async () => {
      // Arrange
      const saveFn = createCombinedSaveFn({ eventStore: es })
      const state: ExtendedState<CounterState> = {
        state: {
          id: { type: 'counter', id: '00000000-0000-0000-0000-000000000001' },
          count: 0
        },
        version: 1
      }
      const events: ExtendedDomainEvent<CounterEvent>[] = []

      // Assert
      expect(() => saveFn(state, events)).toThrow('NO_EVENTS_GENERATED: No events generated')
    })
  })
})
