import { v7 } from 'uuid'
import { err, ok } from '../utils/result'
import type { Result } from '../utils/result'
import type { AppError } from './error'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type AggregateId = `${string}#${string}`
export type Id<T extends string> = `${T}#${string}`

export function newAggregateId(type: string): AggregateId {
  return createAggregateId(type, v7())
}

export function createAggregateId(type: string, uuid: string): AggregateId {
  if (!UUID_REGEX.test(uuid)) {
    throw new Error(`Invalid UUID format: ${uuid}`)
  }
  return `${type}#${uuid}` as AggregateId
}

export function parseAggregateId(id: string): Result<{ type: string; uuid: string }, AppError> {
  const [type, uuid] = id.split('#')

  if (!type || !uuid || !UUID_REGEX.test(uuid)) {
    return err({
      code: 'INVALID_AGGREGATE_ID',
      message: `Invalid AggregateId format: ${id}`
    })
  }

  return ok({ type, uuid })
}
