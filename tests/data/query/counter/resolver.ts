import { type QueryResolver, createQueryResolver } from '../../../../src'
import type { ViewMap } from '../../../../src/types'
import type { CounterListQuery, CounterQuery, QueryMap } from './types'

const resolver: QueryResolver<QueryMap, ViewMap> = {
  counterList: {
    counterList: {
      view: 'counter',
      options: (q: CounterListQuery) => q.options
    }
  },
  counter: {
    counter: {
      view: 'counter',
      id: (q: CounterQuery) => q.id
    }
  }
}

export const counterResolver = createQueryResolver<'counter', QueryMap, ViewMap>({
  type: 'counter',
  resolver
})
