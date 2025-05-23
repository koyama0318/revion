import type { AggregateId, AppError, Result } from '../types'
import { err, ok } from './result'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validateAggregateId(id: AggregateId): Result<void, AppError> {
  const isNotEmpty = id.type !== '' && id.id !== ''
  if (!isNotEmpty) {
    return err({
      code: 'INVALID_AGGREGATE_ID',
      message: 'Aggregate ID is not valid'
    })
  }

  const isUuid = UUID_REGEX.test(id.id)
  if (!isUuid) {
    return err({
      code: 'INVALID_AGGREGATE_ID',
      message: 'Aggregate ID is not valid'
    })
  }

  return ok(undefined)
}

export function isEqualId(id1: AggregateId, id2: AggregateId): boolean {
  return id1.type === id2.type && id1.id === id2.id
}
