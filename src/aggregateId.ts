import { v4 as uuidv4 } from 'uuid'
import type { AggregateId as IAggregateId } from './types/aggregate'

export class AggregateId implements IAggregateId {
  public type: string
  public id: string

  constructor(type: string, id?: string) {
    this.type = type
    this.id = id == null ? uuidv4() : id
  }

  equals(id: AggregateId): boolean {
    return this.type === id.type && this.id === id.id
  }

  toString(): string {
    return `${this.type}#${this.id}`
  }
}
