import type { AggregateId } from './aggregate'

export interface ReadModel {
  id: AggregateId
}

export type Query<T extends ReadModel> =
  | {
      type: T['id']['type']
      id?: T['id']['id']
    }
  | AggregateId
