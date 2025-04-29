import type { Command, CommandHandler, CommandHandlerFactory } from "../types/command"
import type { LiteReplayerMap } from "../types/command-lite"
import type { AppError } from "../types/error"
import type { EventStore } from "../types/event-store"
import type { AggregateId } from "../types/id"
import { parseAggregateId } from "../types/id"
import type { Replay, ReplayerMap, ServiceEventDecider, ServiceEventDeciderFactory } from "../types/service-command"
import { err, ok, type AsyncResult } from "../utils/result"
import { extendLiteReducer } from "./command-lite"
import { replayState } from "./replay-state"

class CommandServiceProcessor {
    constructor(
        private readonly decider: ServiceEventDecider,
        private readonly replayerMap: ReplayerMap,
        private readonly eventStore: EventStore
    ) { }

    async handle(command: Command): AsyncResult<void, AppError> {
        const replayFn: Replay = async (id: AggregateId) => {
            const idResult = parseAggregateId(id)
            if (!idResult.ok) {
                return idResult
            }

            const { type } = idResult.value
            const replayer = this.replayerMap[type]
            if (!replayer) { 
                return err({
                    code: 'REPLAYER_NOT_FOUND',
                    message: 'Replay function not found'
                })
            }

            return await replayState({
                aggregateId: id,
                initState: replayer.initState,
                reducer: replayer.reducer,
                eventStore: this.eventStore
            })
        }
        
        const result = await this.decider(command, replayFn)
        if (!result.ok) {
            return result
        }

        return ok(undefined)
    }
}

export const createCommandServiceHandler = (
    deciderFactory: ServiceEventDeciderFactory,
    replayerMap: ReplayerMap
): CommandHandlerFactory => {
    return (eventStore: EventStore): CommandHandler => {
        const decider = deciderFactory(eventStore)
        const processor = new CommandServiceProcessor(decider, replayerMap, eventStore)

        return async (command: Command): AsyncResult<void, AppError> => {
            return processor.handle(command)
        }
    }
}

export const createLiteCommandServiceHandler = (
    deciderFactory: ServiceEventDeciderFactory,
    replayerMap: LiteReplayerMap
): CommandHandlerFactory => {
    const map: ReplayerMap = {}
    for (const key in replayerMap) {
        const replayer = replayerMap[key];
        if (!replayer) {
            throw new Error(`Replayer ${key} not found`)
        }
        map[key] = {
            aggregateType: key,
            initState: (id: AggregateId) => {
                return {...replayer.initState(id), version: 0}
            },
            reducer: extendLiteReducer(replayer.reducer)
        }
    }
    return createCommandServiceHandler(deciderFactory, map)
}
