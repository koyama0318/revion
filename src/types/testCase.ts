import type { Command, Event } from './aggregate'
import type { ReducerCommand, ReducerEvent, ReducerState } from './reducer'

export interface UnitTestCase<
  C extends ReducerCommand,
  S extends ReducerState,
  E extends ReducerEvent
> {
  command: C
  event: E
  state: S
}

export type UnitTestResult = {
  expected: {
    eventType: string
    eventPayload: unknown
    state: unknown
  }
  actual: {
    eventType: string
    eventPayload: unknown
    state: unknown
  }
}

export interface EventUnitTestCase<E extends ReducerEvent> {
  event: E & Event
  command: Command | undefined
}

export type EventUnitTestResult = {
  expected: {
    command: Command | undefined
  }
  actual: {
    command: Command | undefined
  }
}
