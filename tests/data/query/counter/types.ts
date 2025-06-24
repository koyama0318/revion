import type { GetListOptions } from '../../../../src'
import type { CounterView } from '../view'

export type CounterListQuery = {
  operation: 'counterList'
  options: GetListOptions<CounterView>
}
export type CounterListResult = {
  counterList: CounterView[]
}

export type CounterQuery = {
  operation: 'counter'
  id: string
}
export type CounterResult = {
  counter: CounterView
}

export type QueryMap = {
  counterList: { query: CounterListQuery; result: CounterListResult }
  counter: { query: CounterQuery; result: CounterResult }
}
