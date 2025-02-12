import { makeAggregate } from '../../src/aggregate'
import { makeEventListener } from '../../src/eventListener'
import type { AggregateId } from '../../src/types/aggregate'
import type {
  CasePolicies,
  CaseProjections
} from '../../src/types/eventListener'
import type { CaseEmitters, CaseReducers } from '../../src/types/reducer'
import type { UserCounterReadModel } from './userCounter'

type UserState =
  | { type: 'initial' }
  | { type: 'active'; name: string; age: number }

type UserCommand =
  | {
      type: 'create'
      id: AggregateId
      payload: { name: string; age: number }
    }
  | {
      type: 'update'
      id: AggregateId
      payload: { name?: string; age?: number }
    }

type UserEvent =
  | { type: 'created'; payload: { name: string; age: number } }
  | { type: 'updated'; payload: { name?: string; age?: number } }

const emitter: CaseEmitters<UserState, UserCommand, UserEvent> = {
  create: (state, command) => {
    if (state.type === 'initial') {
      return {
        type: 'created',
        payload: { ...command.payload }
      }
    }
    throw new Error('User already created')
  },
  update: (state, command) => {
    if (state.type === 'active') {
      return {
        type: 'updated',
        payload: { ...command.payload }
      }
    }
    throw new Error('User not created')
  }
}

const reducer: CaseReducers<UserState, UserEvent> = {
  created: (state, event) => {
    return { ...state, ...event.payload, type: 'active' }
  },
  updated: (state, event) => {
    return { ...state, ...event.payload }
  }
}

const policy: CasePolicies<UserEvent> = {
  created: event => ({
    type: 'create',
    id: { type: 'counter', id: event.id.id },
    payload: {}
  })
}

const projection: CaseProjections<UserEvent> = {
  created: async (store, event) => {
    const userCounter = await store.fetchById<UserCounterReadModel>({
      type: 'userCounter',
      id: event.id.id
    })
    if (userCounter) {
      throw new Error('User already exists')
    }
    await store.upsert({
      id: { type: 'userCounter', id: event.id.id },
      name: event.payload.name,
      age: event.payload.age,
      count: 0
    })
  },
  updated: async (store, event) => {
    const userCounter = await store.fetchById<UserCounterReadModel>({
      type: 'userCounter',
      id: event.id.id
    })
    if (!userCounter) {
      throw new Error('User not found')
    }
    await store.upsert({
      ...userCounter,
      ...event.payload
    })
  }
}

export const initialState: UserState = { type: 'initial' }
export const user = makeAggregate('user', initialState, emitter, reducer)
export const userListener = makeEventListener('user', policy, projection)

export { emitter, policy, reducer }
export type { UserCommand, UserEvent, UserState }
