import type { AggregateId, Command, Event } from '../../types/aggregate'
import type { CommandDispatcher } from '../../types/dispatcher'
import type { EventStore } from '../../types/eventStore'
import type { Query, ReadModel } from '../../types/query'
import type { ReadModelStore } from '../../types/readModelStore'

export class EventStoreInMemory implements EventStore {
  events: Event[] = []

  constructor(events: Event[]) {
    this.events = events
  }

  async load(id: AggregateId): Promise<Event[]> {
    return this.events.filter(
      event => event.id.type === id.type && event.id.id === id.id
    )
  }

  async save(events: Event[]) {
    this.events.push(...events)
  }
}

export class CommandDispatcherInMemory implements CommandDispatcher {
  action: (command: Command) => Promise<void>

  constructor(action: (command: Command) => Promise<void>) {
    this.action = action
  }

  async dispatch(command: Command): Promise<void> {
    await this.action(command)
  }
}

export interface ReadModelRecord<T extends ReadModel = ReadModel> {
  type: T['id']['type']
  id: T['id']['id']
  data: T
}

export class ReadModelStoreInMemory implements ReadModelStore {
  records: ReadModelRecord[] = []

  constructor(items: ReadModelRecord[] = []) {
    this.records = items
  }

  async fetchAll<T extends ReadModel>(query: Query<T>): Promise<T[]> {
    return this.records.filter(r => r.type === query.type).map(r => r.data as T)
  }

  async fetchById<T extends ReadModel>(
    query: Query<T>
  ): Promise<T | undefined> {
    return this.records.find(r => r.type === query.type && r.id === query.id)
      ?.data as T | undefined
  }

  async upsert<T extends ReadModel>(data: T): Promise<void> {
    const record: ReadModelRecord<T> = {
      type: data.id.type,
      id: data.id.id,
      data: data
    }
    const index = this.records.findIndex(
      r => r.type === record.type && r.id === record.id
    )
    if (index === -1) {
      this.records.push(record)
    } else {
      this.records[index] = record
    }
  }
}
