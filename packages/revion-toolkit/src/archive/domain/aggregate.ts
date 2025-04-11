// import { Result, err, ok } from 'neverthrow'
// import {
//   type AggregateId,
//   type AggregateType,
//   type AppError,
//   type Command,
//   type DomainEvent,
//   type DomainEventPayload,
//   type EventDecider,
//   type EventStore,
//   type Reducer,
//   type State,
//   createCommandHandler
// } from 'revion-core'
// import { v4 as uuidv4 } from 'uuid'
// import type {
//   ToolkitDomainModel,
//   ToolkitDomainService,
//   ValidationSchema,
//   Validator
// } from '../types'
// import { createValidator } from '../validation'

// /**
//  * ドメインサービスの作成オプション
//  */
// export interface DomainServiceOptions {
//   /**
//    * スナップショットを作成する間隔（イベント数）
//    */
//   snapshotFrequency?: number

//   /**
//    * デバッグモード
//    */
//   debug?: boolean
// }

// /**
//  * ドメインサービスを作成する
//  * Core APIをラップして使いやすいインターフェースを提供
//  */
// export function createDomainService<
//   S extends State,
//   C extends Command,
//   P extends DomainEventPayload
// >(
//   type: AggregateType,
//   model: ToolkitDomainModel<S, C, P>,
//   eventStore: EventStore,
//   validationSchema?: ValidationSchema<C>,
//   options: DomainServiceOptions = {}
// ): ToolkitDomainService<S, C, P> {
//   // デバッグモード
//   const debug = options.debug || false

//   // バリデーターのマップを作成
//   const validators = new Map<string, Validator<unknown>>()
//   if (validationSchema) {
//     Object.entries(validationSchema).forEach(([operation, schema]) => {
//       if (schema) {
//         validators.set(operation, createValidator(schema))
//       }
//     })
//   }

//   // Core APIのコマンドハンドラを作成
//   const handleCommand = createCommandHandler<S, C, P>(
//     model.decider,
//     model.reducer,
//     model.createInitialState,
//     eventStore
//   )

//   /**
//    * コマンドを実行して結果のイベントを返す
//    */
//   async function execute(command: C): Promise<DomainEvent<P>[]> {
//     // 入力バリデーション
//     const validator = validators.get(command.operation)
//     if (validator && command.payload) {
//       const validationResult = validator(command.payload)

//       if (validationResult.isErr()) {
//         // バリデーションエラーの場合はログに出力して例外をスロー
//         if (debug) {
//           console.error(
//             `Validation failed for command ${command.operation}:`,
//             validationResult.error
//           )
//         }
//         throw validationResult.error
//       }
//     }

//     // コマンドを実行
//     const result = await handleCommand(command)

//     if (result.isErr()) {
//       // エラーの場合はログに出力して例外をスロー
//       if (debug) {
//         console.error(
//           `Failed to execute command ${command.operation}:`,
//           result.error
//         )
//       }
//       throw result.error
//     }

//     return result.value.events
//   }

//   /**
//    * 現在の状態を取得
//    */
//   async function getState(id: AggregateId): Promise<S> {
//     // コアの型と互換性がないため、一時的な実装
//     // 本来は適切にEventStoreから状態を再構築するべき
//     try {
//       const snapshotResult = await eventStore.loadSnapshot(type, id)
//       if (snapshotResult.isOk() && snapshotResult.value) {
//         return snapshotResult.value.state as S
//       }

//       // スナップショットがない場合はイベント履歴から再構築
//       const eventsResult = await eventStore.loadHistory(type, id)
//       if (eventsResult.isOk() && eventsResult.value.length > 0) {
//         const events = eventsResult.value as DomainEvent<P>[]
//         let state = model.createInitialState(type, id)

//         // イベントを順に適用
//         for (const event of events) {
//           state = model.reducer(state, event)
//         }

//         return state
//       }

//       // 履歴がない場合は初期状態を返す
//       return model.createInitialState(type, id)
//     } catch (error) {
//       if (debug) {
//         console.error(`Failed to get state for ${type}/${id}:`, error)
//       }
//       throw error
//     }
//   }

//   /**
//    * 新しいIDを生成
//    */
//   function generateId(): AggregateId {
//     return uuidv4()
//   }

//   // パブリックAPI
//   return {
//     aggregateType: type,
//     execute,
//     getState,
//     generateId
//   }
// }
