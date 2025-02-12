import { makeAggregate } from '../../src/aggregate'
import { makeEventListener } from '../../src/eventListener'
import type { AggregateId } from '../../src/types/aggregate'
import type {
  CasePolicies,
  CaseProjections
} from '../../src/types/eventListener'
import type { CaseEmitters, CaseReducers } from '../../src/types/reducer'
import type { UserCounterReadModel } from './userCounter'

type CounterState =
  | { type: 'initial'; value: number }
  | { type: 'active'; value: number }

type CounterCommand =
  | { type: 'create'; id: AggregateId }
  | { type: 'increment'; id: AggregateId }
  | { type: 'decrement'; id: AggregateId }
  | { type: 'reset'; id: AggregateId }

type CounterEvent =
  | { type: 'created'; payload: { value: number } }
  | { type: 'added'; payload: { value: number; isMax: boolean } }
  | { type: 'subtracted'; payload: { value: number } }
  | { type: 'reseted' }

const emitter: CaseEmitters<CounterState, CounterCommand, CounterEvent> = {
  create: state => ({
    type: 'created',
    payload: { value: state.value }
  }),
  increment: state => ({
    type: 'added',
    payload: { value: 1, isMax: state.value + 1 > 10 }
  }),
  decrement: () => ({ type: 'subtracted', payload: { value: 1 } }),
  reset: () => ({ type: 'reseted' })
}

const reducer: CaseReducers<CounterState, CounterEvent> = {
  created: state => {
    return { ...state, type: 'active', value: 0 }
  },
  added: (state, event) => {
    return { ...state, value: state.value + event.payload.value }
  },
  subtracted: (state, event) => {
    return { ...state, value: state.value - event.payload.value }
  },
  reseted: state => {
    return { ...state, value: 0 }
  }
}

const policy: CasePolicies<CounterEvent> = {
  created: event => ({
    type: 'increment',
    id: event.id,
    payload: {}
  }),
  added: event =>
    event.payload.isMax ? { type: 'reset', id: event.id } : undefined
}

const projection: CaseProjections<CounterEvent> = {
  created: async (store, event) => {
    const userCounter = await store.fetchById<UserCounterReadModel>({
      type: 'userCounter',
      id: event.id.id
    })
    if (userCounter) {
      return await store.upsert({
        ...userCounter,
        count: 0
      })
    }
    await store.upsert({
      id: { type: 'userCounter', id: event.id.id },
      count: 0
    })
  },
  added: async (store, event) => {
    const userCounter = await store.fetchById<UserCounterReadModel>({
      type: 'userCounter',
      id: event.id.id
    })
    if (userCounter) {
      await store.upsert({
        ...userCounter,
        count: userCounter.count + event.payload.value
      })
    }
  },
  subtracted: async (store, event) => {
    const userCounter = await store.fetchById<UserCounterReadModel>({
      type: 'userCounter',
      id: event.id.id
    })
    if (userCounter) {
      await store.upsert({
        ...userCounter,
        count: userCounter.count - event.payload.value
      })
    }
  },
  reseted: async (store, event) => {
    const userCounter = await store.fetchById<UserCounterReadModel>({
      type: 'userCounter',
      id: event.id.id
    })
    if (userCounter) {
      await store.upsert({
        ...userCounter,
        count: 0
      })
    }
  }
}

export const initialState: CounterState = { type: 'initial', value: 0 }
export const counter = makeAggregate('counter', initialState, emitter, reducer)
export const counterListener = makeEventListener('counter', policy, projection)

export { emitter, policy, reducer }
export type { CounterCommand, CounterEvent, CounterState }
