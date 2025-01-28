export { makeAggregate } from './aggregate'
export { AggregateId as ID } from './aggregateId'
export { makeEventListener } from './eventListener'
export { CommandHandler, EventHandler } from './handler'
export { integrationTest } from './integrationTest'
export type { Command, Event } from './types/aggregate'
export type { CommandDispatcher } from './types/dispatcher'
export type {
  CasePolicies as Policy,
  CaseProjections as Projection
} from './types/eventListener'
export type { EventStore } from './types/eventStore'
export type {
  CaseEmitters as Emitter,
  CaseReducers as Reducer
} from './types/reducer'
export type {
  EventUnitTestCase,
  EventUnitTestResult,
  UnitTestCase,
  UnitTestResult
} from './types/testCase'
export { aggregateTest, eventListenerTest } from './unitTest'
