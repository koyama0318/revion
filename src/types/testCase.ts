import type { ReadModelRecord } from '../utils/fake/storeInMemory'
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
  command?: Command
  preReadModels: ReadModelRecord[]
  readModels: ReadModelRecord[]
}

export type EventUnitTestResult = {
  expected: {
    command?: Command
    readModels: ReadModelRecord[]
  }
  actual: {
    command?: Command
    readModels: ReadModelRecord[]
  }
}

export type IntegrationTestCase = {
  commands: Command[]
  events: Event[]
  readModels: ReadModelRecord[]
}

export type IntegrationTestResult = {
  expected: {
    events: Event[]
    readModels: ReadModelRecord[]
  }
  actual: {
    events: Event[]
    readModels: ReadModelRecord[]
  }
}
