import type { CombinedApplyEventFn, CombinedSaveEventFn } from '../command/combined'
import type { Command, DomainEvent, ExtendedDomainEvent, ExtendedState, State } from '../types'

export type StateCommandPair<S extends State, C extends Command> = {
  state: ExtendedState<S>
  command: C
}

export async function applyAndSave<S extends State, C extends Command, E extends DomainEvent>(
  pairs: StateCommandPair<S, C>[],
  applyFn: CombinedApplyEventFn,
  saveFn: CombinedSaveEventFn
): Promise<void> {
  const eventsMap = new Map<ExtendedState<S>, ExtendedDomainEvent<E>[]>()

  for (const { state, command } of pairs) {
    const { events } = applyFn<S, C, E>(state, command)
    eventsMap.set(state, events)
  }

  for (const [state, events] of eventsMap.entries()) {
    await saveFn(state, events)
  }
}
