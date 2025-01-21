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
