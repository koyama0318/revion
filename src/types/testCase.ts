import type { Command, Event } from './aggregate'
import type { ReducerCommand, ReducerEvent, ReducerState } from './reducer'

export interface TestCase<
  C extends ReducerCommand,
  S extends ReducerState,
  E extends ReducerEvent
> {
  label?: string
  command: C
  expectedEvent: E
  expectedState: S
}

export interface TestCaseEvent<E extends ReducerEvent> {
  label?: string
  event: E & Event
  expectedCommand: Command
}
