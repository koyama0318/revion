import type { Command, Event } from './aggregate'
import type { ReducerCommand, ReducerEvent, ReducerState } from './reducer'

export interface UnitTestCase<
  C extends ReducerCommand,
  S extends ReducerState,
  E extends ReducerEvent
> {
  label?: string
  command: C
  expectedEvent: E
  expectedState: S
}

export type UnitTestResult = {
  label: string
  expected: {
    state: unknown
    eventType: string
    eventPayload: unknown
  }
  output: {
    state: unknown
    eventType: string
    eventPayload: unknown
  }
}

export interface EventUnitTestCase<E extends ReducerEvent> {
  label?: string
  event: E & Event
  expectedCommand: Command
}

export type EventUnitTestResult = {
  label: string
  expected: {
    command: Command | undefined
  }
  output: {
    command: Command | undefined
  }
}
