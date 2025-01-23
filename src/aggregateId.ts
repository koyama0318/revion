import { v4 as uuidv4 } from 'uuid'

export type AggregateId = {
  type: string
  id: string
}

export function NewAggregateId(
  type: string,
  id: string | undefined
): AggregateId {
  if (!id) {
    id = uuidv4()
  }
  return { type, id }
}
