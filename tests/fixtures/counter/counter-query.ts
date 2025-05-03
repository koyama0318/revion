import { createQueryHandler } from '../../../src/query/query-handler'
import type { AppError } from '../../../src/types/error'
import type { ReadStorage } from '../../../src/types/read-storage'
import type { AsyncResult } from '../../../src/utils/result'
import { err, ok } from '../../../src/utils/result'
import type {
  CounterByIdQuery,
  CounterByIdResult,
  CounterListQuery,
  CounterListResult,
  CounterView
} from './types'

const getCounterList = async (
  readStorage: ReadStorage,
  _query: CounterListQuery
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

export const queryHandler1 = createQueryHandler<CounterListQuery, CounterListResult>(getCounterList)
export const queryHandler2 = createQueryHandler<CounterByIdQuery, CounterByIdResult>(getCounterById)
