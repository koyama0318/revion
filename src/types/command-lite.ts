import type { Result } from '../utils/result'
import type { AppError } from './error'
import type { AggregateId } from './id'

export type LiteState = {
  aggregateId: AggregateId
}

export type LiteCommand = {
  aggregateId: AggregateId
  operation: string
  payload?: unknown
}

export type LiteDomainEvent = {
  aggregateId: AggregateId
  eventType: string
  payload?: unknown
}

export type LiteEventDecider<LS extends LiteState, LC extends LiteCommand, LE extends LiteDomainEvent> = (
  state: LS,
  command: LC
) => Result<LE[], AppError>

export type LiteReducer<LS extends LiteState, LE extends LiteDomainEvent> = (state: LS, event: LE) => LS

export type LiteReplayerMap = {
  [K in string]?: LiteReplayer<any, any>;
};

export type LiteReplayer<S extends LiteState, E extends LiteDomainEvent> = {
  aggregateType: string,
  initState: (id: AggregateId) => S,
  reducer: (state: S, event: E) => S
}
