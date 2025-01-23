import type { EventStore } from '../../src/types/eventStore'
import type { Event, AggregateId } from '../../src/types/aggregate'

export class EventStoreInMemory implements EventStore {
  events: Event[] = []

  load(id: AggregateId): Event[] {
    return this.events.filter(
      event => event.id.type === id.type && event.id.id === id.id
    )
  }

  save(events: Event[]) {
    this.events.push(...events)
  }
}
