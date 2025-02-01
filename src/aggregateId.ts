import { v4 as uuidv4 } from 'uuid'

export type AggregateId = {
  type: string
  id: string
}

export function newID(type: string, id?: string): AggregateId {
  return {
    type,
    id: id == null ? uuidv4() : id
  }
}
