export type CounterView = {
  type: 'counter'
  id: string
  count: number
}

export type ViewMap = {
  counter: CounterView
}
