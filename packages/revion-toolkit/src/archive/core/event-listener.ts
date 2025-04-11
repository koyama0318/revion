// import { type Result, err, ok } from 'neverthrow'
// import type {
//   AggregateType,
//   AppError,
//   Event,
//   EventListener,
//   EventStore,
//   Policy,
//   Projection,
//   Store
// } from '../types'

// /**
//  * イベントリスナーの作成オプション
//  */
// export interface EventListenerOptions {
//   /**
//    * リスナーの一意なID
//    * 未指定の場合は自動生成
//    */
//   id?: string

//   /**
//    * エラー発生時にリトライするかどうか
//    * デフォルト: false
//    */
//   retry?: boolean

//   /**
//    * 最大リトライ回数
//    * デフォルト: 3
//    */
//   maxRetries?: number

//   /**
//    * リトライ間隔（ミリ秒）
//    * デフォルト: 1000
//    */
//   retryDelay?: number
// }

// /**
//  * イベントリスナーを作成する関数
//  */
// export function makeEventListener<E extends Event, O extends Event = E>(
//   aggregateType: AggregateType,
//   policy: Policy<E, O>,
//   projection: Projection<O>,
//   store: Store,
//   options: EventListenerOptions = {}
// ): EventListener<E> {
//   const id = options.id || `${aggregateType}-listener-${Date.now()}`
//   const retry = options.retry || false
//   const maxRetries = options.maxRetries || 3
//   const retryDelay = options.retryDelay || 1000

//   /**
//    * 単一のイベントを処理する
//    */
//   async function handleEvent(event: E): Promise<Result<void, AppError>> {
//     // イベントタイプに対応するポリシー関数があるか確認
//     const policyFn = policy[event.type]

//     // ポリシー関数がなければ、このイベントは処理しない
//     if (!policyFn) {
//       return ok(undefined)
//     }

//     try {
//       // ポリシー関数を実行
//       const processedEvent = policyFn(event as any)

//       // nullならイベントをスキップ
//       if (!processedEvent) {
//         return ok(undefined)
//       }

//       // イベントタイプに対応する射影関数があるか確認
//       const projectionFn = projection[processedEvent.type]

//       // 射影関数がなければエラー
//       if (!projectionFn) {
//         return err({
//           type: 'EventHandlerError',
//           message: `No projection found for event type: ${processedEvent.type}`,
//           eventType: processedEvent.type,
//           details: { aggregateType }
//         })
//       }

//       // 射影関数を実行
//       await projectionFn(store, processedEvent as any)

//       return ok(undefined)
//     } catch (error) {
//       return err({
//         type: 'EventHandlerError',
//         message: 'Error handling event',
//         eventType: event.type,
//         cause: error,
//         details: { eventId: event.id, aggregateType }
//       })
//     }
//   }

//   /**
//    * 複数のイベントを処理する
//    */
//   async function processEvents(events: E[]): Promise<Result<void, AppError>> {
//     // イベントを順番に処理
//     for (const event of events) {
//       let result = await handleEvent(event)
//       let retryCount = 0

//       // リトライが有効で、エラーが発生し、最大リトライ回数未満なら再試行
//       while (retry && result.isErr() && retryCount < maxRetries) {
//         // リトライ間隔を待機
//         await new Promise(resolve => setTimeout(resolve, retryDelay))

//         // イベント処理を再試行
//         result = await handleEvent(event)
//         retryCount++
//       }

//       // 最終的にエラーが発生したら処理を中止
//       if (result.isErr()) {
//         return err({
//           ...result.error,
//           message: `Failed to process event after ${retryCount} retries: ${result.error.message}`,
//           details: {
//             ...(result.error.details || {}),
//             retries: retryCount
//           }
//         })
//       }
//     }

//     return ok(undefined)
//   }

//   /**
//    * イベントストアからイベントを読み込んで処理する
//    */
//   async function replay(
//     eventStore: EventStore<E>,
//     fromVersion = 0
//   ): Promise<Result<void, AppError>> {
//     // イベントストアからイベントを取得
//     const eventsResult = await eventStore.getAllEvents(aggregateType)
//     if (eventsResult.isErr()) {
//       return err(eventsResult.error)
//     }

//     // バージョンでフィルタリング
//     const events = eventsResult.value.filter(
//       event => (event.version || 0) > fromVersion
//     )

//     // イベントをすべて処理
//     return processEvents(events)
//   }

//   return {
//     id,
//     type: aggregateType,
//     handleEvent,
//     processEvents
//   }
// }
