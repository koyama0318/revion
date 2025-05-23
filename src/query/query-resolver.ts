import type { QueryMap, QueryResolverFn, ViewMap } from '../types'

export type QueryResolver<T extends string, Q extends QueryMap, V extends ViewMap> = {
  type: T
  resolver: QueryResolverFn<Q, V>
}

// biome-ignore lint/suspicious/noExplicitAny:
export type AnyQueryResolver = QueryResolver<any, any, any>

export const createQueryResolver = <T extends string, Q extends QueryMap, V extends ViewMap>({
  type,
  resolver
}: {
  type: T
  resolver: QueryResolverFn<Q, V>
}): QueryResolver<T, Q, V> => {
  return {
    type,
    resolver
  }
}
