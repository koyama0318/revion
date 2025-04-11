// import { Result, err, ok } from 'neverthrow'
// import { v4 as uuidv4 } from 'uuid'
// import type {
//   Aggregate,
//   AggregateType,
//   AppError,
//   Command,
//   Decider,
//   Event,
//   EventStore,
//   ID,
//   Reducer,
//   State
// } from '../types'

// /**
//  * アグリゲートの初期状態を取得する関数の型
//  */
// export type InitialStateFn<S extends State> = () => S

// /**
//  * イベントにメタデータを追加する関数の型
//  */
// export type EventMetadataFn<E extends Event> = (
//   event: E
// ) => Record<string, unknown>

// /**
//  * アグリゲート作成オプション
//  */
// export interface AggregateOptions<E extends Event> {
//   /**
//    * スナップショットを生成する頻度（イベント数）
//    * デフォルト: 100
//    */
//   snapshotFrequency?: number

//   /**
//    * イベントにメタデータを追加する関数
//    */
//   eventMetadataFn?: EventMetadataFn<E>
// }

// /**
//  * アグリゲートを作成する関数
//  */
// export function makeAggregate<
//   S extends State,
//   C extends Command,
//   E extends Event
// >(
//   aggregateType: AggregateType,
//   initialStateFn: InitialStateFn<S>,
//   decider: Decider<S, C, E>,
//   reducer: Reducer<S, E>,
//   eventStore: EventStore<E>,
//   options: AggregateOptions<E> = {}
// ): Aggregate<S, C, E> {
//   const snapshotFrequency = options.snapshotFrequency ?? 100
//   const eventMetadataFn = options.eventMetadataFn

//   /**
//    * コマンドを実行し、イベントを生成する
//    */
//   async function execute(command: C): Promise<Result<E[], AppError>> {
//     // 現在の状態を取得
//     const stateResult = await getState(command.id)
//     if (stateResult.isErr()) {
//       return err(stateResult.error)
//     }

//     const state = stateResult.value

//     // コマンドに対応するデシーダー関数を実行
//     const deciderFn = decider[command.type]
//     if (!deciderFn) {
//       return err({
//         type: 'CommandError',
//         message: `No decider found for command type: ${command.type}`,
//         details: { commandType: command.type, aggregateType }
//       })
//     }

//     // コマンドからイベントを生成
//     let eventResult
//     try {
//       eventResult = deciderFn(state, command as any)

//       // Resultではない場合、okでラップ
//       if (!(eventResult instanceof Result)) {
//         eventResult = ok(eventResult)
//       }
//     } catch (error) {
//       return err({
//         type: 'CommandError',
//         message: 'Error executing command',
//         cause: error,
//         details: { commandType: command.type, aggregateId: command.id }
//       })
//     }

//     if (eventResult.isErr()) {
//       return err(eventResult.error)
//     }

//     // 単一のイベントを配列に変換
//     const events = Array.isArray(eventResult.value)
//       ? eventResult.value
//       : [eventResult.value]

//     // イベントにメタデータを付与
//     const processedEvents = events.map((event, index) => {
//       // イベントにID, タイムスタンプ, バージョンを付与
//       const baseEvent: E = {
//         ...event,
//         id: event.id || command.id,
//         timestamp: event.timestamp || new Date(),
//         version: (state as any).version
//           ? (state as any).version + index + 1
//           : index + 1,
//         metadata: {
//           ...event.metadata,
//           aggregateType,
//           commandType: command.type,
//           ...(eventMetadataFn ? eventMetadataFn(event) : {})
//         }
//       }
//       return baseEvent
//     })

//     // イベントを保存
//     const saveResult = await eventStore.saveEvents(
//       aggregateType,
//       command.id,
//       processedEvents
//     )

//     if (saveResult.isErr()) {
//       return err(saveResult.error)
//     }

//     // 最新状態を計算
//     let updatedState = state
//     for (const event of processedEvents) {
//       // イベントタイプに対応するリデューサー関数を実行
//       const reducerFn = reducer[event.type]
//       if (reducerFn) {
//         updatedState = reducerFn(updatedState, event as any)
//       }
//     }

//     // スナップショットを作成（一定の頻度で）
//     const latestVersion =
//       processedEvents[processedEvents.length - 1].version ?? 0
//     if (latestVersion % snapshotFrequency === 0) {
//       await eventStore.saveSnapshot(
//         aggregateType,
//         command.id,
//         updatedState,
//         latestVersion
//       )
//     }

//     return ok(processedEvents)
//   }

//   /**
//    * 現在の状態を取得する
//    */
//   async function getState(id: ID): Promise<Result<S, AppError>> {
//     // まずスナップショットを試みる
//     const snapshotResult = await eventStore.getSnapshot<S>(aggregateType, id)
//     if (snapshotResult.isErr()) {
//       return err(snapshotResult.error)
//     }

//     let state: S
//     let fromVersion = 0

//     // スナップショットがあれば使用
//     if (snapshotResult.value) {
//       state = snapshotResult.value.state
//       fromVersion = snapshotResult.value.version
//     } else {
//       // スナップショットがなければ初期状態から開始
//       state = initialStateFn()
//     }

//     // スナップショット以降のイベントを適用
//     const eventsResult = await eventStore.getEvents(
//       aggregateType,
//       id,
//       fromVersion
//     )
//     if (eventsResult.isErr()) {
//       return err(eventsResult.error)
//     }

//     const events = eventsResult.value
//     if (events.length === 0) {
//       return ok(state)
//     }

//     // 全てのイベントを適用して状態を再構築
//     return applyEvents(id, events, state)
//   }

//   /**
//    * 一連のイベントを適用して状態を再構築
//    */
//   async function applyEvents(
//     id: ID,
//     events: E[],
//     initialState?: S
//   ): Promise<Result<S, AppError>> {
//     // 初期状態が与えられなければ、デフォルトを使用
//     let state = initialState ?? initialStateFn()

//     // 全てのイベントを順番に適用
//     for (const event of events) {
//       const reducerFn = reducer[event.type]
//       if (reducerFn) {
//         state = reducerFn(state, event as any)
//       }
//     }

//     return ok(state)
//   }

//   return {
//     type: aggregateType,
//     execute,
//     getState,
//     applyEvents: (id: ID, events: E[]) => applyEvents(id, events)
//   }
// }

// /**
//  * IDを生成する関数
//  */
// export function generateId(): ID {
//   return uuidv4()
// }
