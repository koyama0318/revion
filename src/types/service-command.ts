import type { AsyncResult } from "../utils/result";
import type { DomainEvent, State } from "./command";
import type { LiteCommand, LiteDomainEvent, LiteState } from "./command-lite";
import type { AppError } from "./error";
import type { EventStore } from "./event-store";
import type { AggregateId } from "./id";

export type Replay = (id: AggregateId) => AsyncResult<LiteState, AppError>

export type ServiceEventDecider = (command: LiteCommand, replay: Replay) => AsyncResult<LiteDomainEvent[], AppError>

export type ServiceEventDeciderFactory = (eventStore: EventStore) => ServiceEventDecider

export type ReplayerMap = {
    [K in string]?: Replayer<any, any>;
};

export type Replayer<S extends State, E extends DomainEvent> = {
    aggregateType: string,
    initState: (id: AggregateId) => S,
    reducer: (state: S, event: E) => S
}
