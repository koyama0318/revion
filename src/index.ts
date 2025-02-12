export { makeAggregate } from './aggregate'
export { newID } from './aggregateId'
export type { AggregateId as ID } from './aggregateId'
export { makeEventListener } from './eventListener'
export { CommandHandler, EventHandler } from './handler'
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
  IntegrationTestCase,
  IntegrationTestResult,
  UnitTestCase,
  UnitTestResult
} from './types/testCase'
export { FakeHandler } from './utils/fake/fakeHandler'
export type { ReadModelRecord } from './utils/fake/storeInMemory'
export { integrationTest } from './utils/test/integrationTest'
export { aggregateTest, eventListenerTest } from './utils/test/unitTest'
