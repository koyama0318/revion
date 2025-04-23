import { QueryBus } from '../../src/query/query-bus'
import { createQueryHandler } from '../../src/query/query-handler'
import type { AppError } from '../../src/types/error'
import type { QueryHandlerFactory } from '../../src/types/query'
import type { ReadStorage } from '../../src/types/read-storage'
import { ReadStorageInMemory } from '../../src/utils/read-storage-in-memory'
import { err, ok } from '../../src/utils/result'
import type { AsyncResult } from '../../src/utils/result'

type CounterView = {
  type: 'Counter'
  id: string
  count: number
}

type CounterListQuery = {
  type: 'counterList'
}

type CounterListResult = {
  counters: CounterView[]
}

type CounterByIdQuery = {
  type: 'counterById'
  id: string
}

type CounterByIdResult = {
  counter: CounterView
}

const getCounterList = async (
  readStorage: ReadStorage,
  query: CounterListQuery
): AsyncResult<CounterListResult, AppError> => {
  const result = await readStorage.getList('Counter')
  if (!result.ok) {
    return err(result.error)
  }

  const counterViews = result.value as CounterView[]
  return ok({ counters: counterViews })
}

const getCounterById = async (
  readStorage: ReadStorage,
  query: CounterByIdQuery
): AsyncResult<CounterByIdResult, AppError> => {
  const result = await readStorage.getById('Counter', query.id)
  if (!result.ok) {
    return err(result.error)
  }

  const counterView = result.value as CounterView
  return ok({ counter: counterView })
}

export function setupQueryHandlerFactory1(): QueryHandlerFactory {
  return createQueryHandler<CounterListQuery, CounterListResult>(getCounterList)
}

export function setupQueryHandlerFactory2(): QueryHandlerFactory {
  return createQueryHandler<CounterByIdQuery, CounterByIdResult>(getCounterById)
}

const storage = new ReadStorageInMemory()
const factory1 = setupQueryHandlerFactory1()
const factory2 = setupQueryHandlerFactory2()
const handler1 = factory1(storage)
const handler2 = factory2(storage)
export const queryBus = new QueryBus({ counterList: handler1, counterById: handler2 })
