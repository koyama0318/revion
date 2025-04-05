export interface State {
  type: string
  version: number
}

export interface Command {
  operation: string
  id: AggregateId
  payload?: unknown
}

export interface Event {
  type: string
  id: AggregateId
  payload?: unknown
  version: number
  timestamp: Date
}

export interface AggregateId {
  type: string
  id: string
}

export interface Aggregate {
  type: string
  initialState: State
  state: State
  events: Event[]
  uncommittedEvents: Event[]
  processCommand(command: Command): this
  applyEvents(events: Event[]): this
  applyEvent(event: Event): this
  commitEvents(): this
  reset(): this
}
