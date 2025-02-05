import type { AggregateId, Event } from '../../src/types/aggregate'
import type { EventStore } from '../../src/types/eventStore'

export class EventStoreInMemory implements EventStore {
  events: Event[] = []

  async load(id: AggregateId): Promise<Event[]> {
    return this.events.filter(
      event => event.id.type === id.type && event.id.id === id.id
    )
  }

  async save(events: Event[]) {
    this.events.push(...events)
  }
}
