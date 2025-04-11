// import { type Result, err, ok } from 'neverthrow'
// import type {
//   AggregateType,
//   AppError,
//   DomainEvent,
//   DomainEventPayload,
//   EventListener,
//   EventStore
// } from 'revion-core'
// import { v4 as uuidv4 } from 'uuid'
// import type { DataStore, ToolkitReadModel } from '../types'

// /**
//  * イベントリスナーの作成オプション
//  */
// export interface EventProcessorOptions {
//   /**
//    * リスナーの一意なID
//    */
//   id?: string

//   /**
//    * エラー発生時にリトライするかどうか
//    */
//   retry?: boolean

//   /**
//    * 最大リトライ回数
//    */
//   maxRetries?: number

//   /**
//    * リトライ間隔（ミリ秒）
//    */
//   retryDelay?: number

//   /**
//    * デバッグモード
//    */
//   debug?: boolean
// }

// /**
//  * イベントプロセッサを作成する
//  * よりシンプルなAPIでイベントリスナーを実装
//  */
// export function createEventProcessor<E extends DomainEvent<DomainEventPayload>>(
//   type: AggregateType,
//   readModel: ToolkitReadModel<E>,
//   store: DataStore,
//   options: EventProcessorOptions = {}
// ): EventListener {
//   // オプション
//   const id = options.id || `${type}-listener-${uuidv4()}`
//   const debug = options.debug || false
//   const retry = options.retry || false
//   const maxRetries = options.maxRetries || 3
//   const retryDelay = options.retryDelay || 1000

//   // リスナーの実装
//   const listener: EventListener = {
//     id,
//     aggregateType: type,

//     // イベントの処理
//     async handleEvent(
//       event: DomainEvent<DomainEventPayload>
//     ): Promise<Result<void, AppError>> {
//       // 型チェック（ここでEにキャストできるかを確認）
//       const typedEvent = event as E
//       const { policy, projection } = readModel

//       // イベントタイプに対応するポリシーを取得
//       const policyFn = policy[event.payload.eventType]
//       if (!policyFn) {
//         // ポリシーがない場合は何もしない
//         return ok(undefined)
//       }

//       // ポリシーを適用してイベントをフィルタリング
//       const filteredEvent = policyFn(typedEvent)
//       if (!filteredEvent) {
//         // フィルタされたイベントがない場合は何もしない
//         return ok(undefined)
//       }

//       // イベントタイプに対応する射影を取得
//       const projectionFn = projection[event.payload.eventType]
//       if (!projectionFn) {
//         // 射影がない場合は何もしない
//         if (debug) {
//           console.warn(
//             `No projection found for event type ${event.payload.eventType}`
//           )
//         }
//         return ok(undefined)
//       }

//       // 射影を適用して読み取りモデルを更新
//       try {
//         let attempts = 0
//         let success = false
//         let lastError: unknown

//         while (!success && attempts <= maxRetries) {
//           try {
//             await projectionFn(store, filteredEvent)
//             success = true
//           } catch (error) {
//             lastError = error
//             attempts++

//             if (retry && attempts <= maxRetries) {
//               if (debug) {
//                 console.warn(
//                   `Projection failed for event ${event.payload.eventType}, retrying (${attempts}/${maxRetries})...`
//                 )
//               }
//               // リトライ前に少し待つ
//               await new Promise(resolve => setTimeout(resolve, retryDelay))
//             } else {
//               break
//             }
//           }
//         }

//         if (!success) {
//           if (debug) {
//             console.error(
//               `Projection failed for event ${event.payload.eventType} after ${attempts} attempts`,
//               lastError
//             )
//           }
//           return err({
//             type: 'EventHandlerError',
//             message: `Projection failed for event ${event.payload.eventType}`,
//             details: { event, error: lastError }
//           })
//         }

//         return ok(undefined)
//       } catch (error) {
//         if (debug) {
//           console.error(
//             `Error processing event ${event.payload.eventType}:`,
//             error
//           )
//         }
//         return err({
//           type: 'EventHandlerError',
//           message: `Error processing event ${event.payload.eventType}`,
//           details: { event, error }
//         })
//       }
//     },

//     // 複数イベントの一括処理
//     async processEvents(
//       events: DomainEvent<DomainEventPayload>[]
//     ): Promise<Result<void, AppError>> {
//       for (const event of events) {
//         const result = await this.handleEvent(event)
//         if (result.isErr()) {
//           return result
//         }
//       }
//       return ok(undefined)
//     }
//   }

//   return listener
// }

// /**
//  * リプレイ機能
//  * イベントストアからすべてのイベントを取得して処理する
//  */
// export async function replayEvents(
//   listener: EventListener,
//   eventStore: EventStore,
//   fromVersion = 0
// ): Promise<Result<void, AppError>> {
//   try {
//     // すべてのイベントを取得
//     const result = await eventStore.loadHistory(
//       listener.aggregateType,
//       '*',
//       fromVersion
//     )

//     if (result.isErr()) {
//       return err({
//         type: 'EventHandlerError',
//         message: 'Failed to load events for replay',
//         details: { error: result.error }
//       })
//     }

//     const events = result.value

//     // バージョンでフィルタリング
//     const filteredEvents =
//       fromVersion > 0
//         ? events.filter(event => (event.version || 0) > fromVersion)
//         : events

//     // イベントを処理
//     return await listener.processEvents(filteredEvents)
//   } catch (error) {
//     return err({
//       type: 'EventHandlerError',
//       message: 'Error during event replay',
//       details: { error }
//     })
//   }
// }
