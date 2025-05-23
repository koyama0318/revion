import { createQueryResolver } from '../../../../src'
import type { QueryResolverFn, ViewMap } from '../../../../src/types'
import type { CounterListQuery, CounterQuery, QueryMap } from './types'

const resolver: QueryResolverFn<QueryMap, ViewMap> = {
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
