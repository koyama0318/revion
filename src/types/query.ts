import type { GetListOptions } from './read-database'
import type { ViewMap } from './view'

export type Query = { operation: string }

export type QueryResult = { [key: string]: unknown }

export type QueryDefinition<Q extends Query, QR extends QueryResult> = {
  query: Q
  result: QR
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type AnyQueryDefinition = QueryDefinition<any, any>

export type QueryMap = {
  [K in string]: AnyQueryDefinition
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type AnyOptions = GetListOptions<any>

type ViewResolverDefinition<K extends string, Q extends Query> =
  | {
      view: K
      id: (q: Q) => string
    }
  | {
      view: K
      options: (q: Q) => AnyOptions
    }

export type QueryResolverFn<QM extends QueryMap, VM extends ViewMap> = {
  [K in keyof QM]: {
    [RK in keyof (QM[K] extends QueryDefinition<infer _Q, infer R>
      ? R
      : never)]: ViewResolverDefinition<
      Extract<keyof VM, string>,
      QM[K] extends QueryDefinition<infer Q, infer _R> ? Q : never
    >
  }
}
