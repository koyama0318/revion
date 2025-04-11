// import type { Result } from 'neverthrow'
// import type { z } from 'zod'

// // revion-coreから必要な型を直接インポート
// import type {
//   AggregateId,
//   AggregateType,
//   AppError,
//   Command,
//   CommandBus,
//   CommandResultAsync,
//   DomainEvent,
//   DomainEventPayload,
//   EventDecider,
//   Reducer,
//   State,
//   ValidationError
// } from 'revion-core'

// // revion-coreからの他の型を再エクスポート
// export type {
//   Aggregate,
//   AggregateId,
//   AggregateType,
//   AppError,
//   Command,
//   CommandBus,
//   CommandResultAsync,
//   DomainEvent,
//   DomainEventPayload,
//   EventDecider,
//   EventStore,
//   Reducer,
//   State,
//   ValidationError
// } from 'revion-core'

// /**
//  * 汎用的なストア操作のための基本インターフェース
//  */
// export interface DataStore {
//   save: <T>(collection: string, id: string, data: T) => Promise<void>
//   get: <T>(collection: string, id: string) => Promise<T | null>
//   find: <T>(collection: string, query: Record<string, unknown>) => Promise<T[]>
//   delete: (collection: string, id: string) => Promise<void>
// }

// /**
//  * ドメインモデルの定義（コマンド処理とイベント適用ロジックをカプセル化）
//  */
// export interface ToolkitDomainModel<
//   S extends State,
//   C extends Command,
//   P extends DomainEventPayload
// > {
//   /**
//    * 集約の初期状態を生成する関数
//    */
//   createInitialState: (type: AggregateType, id: AggregateId) => S

//   /**
//    * コマンドからイベントへの変換ルール
//    */
//   decider: EventDecider<S, C, P>

//   /**
//    * イベント適用によるステート更新ルール
//    */
//   reducer: Reducer<S, P>
// }

// /**
//  * イベントリスナーのポリシー
//  * イベントをフィルタリングして処理するかどうかを決定
//  */
// export interface ToolkitPolicy<E extends DomainEvent<DomainEventPayload>> {
//   [eventType: string]: (event: E) => E | null
// }

// /**
//  * イベントの射影定義
//  * イベントを受け取って読み取りモデルを更新
//  */
// export interface ToolkitProjection<E extends DomainEvent<DomainEventPayload>> {
//   [eventType: string]: (store: DataStore, event: E) => Promise<void>
// }

// /**
//  * 読み取りモデル定義（イベントからの射影ロジックをカプセル化）
//  */
// export interface ToolkitReadModel<E extends DomainEvent<DomainEventPayload>> {
//   /**
//    * イベントポリシー（フィルタリングロジック）
//    */
//   policy: ToolkitPolicy<E>

//   /**
//    * 射影関数（イベントから読み取りモデルへの変換）
//    */
//   projection: ToolkitProjection<E>
// }

// /**
//  * バリデーションスキーマ定義
//  */
// export interface ValidationSchema<C extends Command> {
//   [operation: string]: z.ZodType<Record<string, unknown>> | undefined
// }

// /**
//  * ドメインサービスインターフェース
//  * コア機能をラップして使いやすいAPIを提供
//  */
// export interface ToolkitDomainService<
//   S extends State,
//   C extends Command,
//   P extends DomainEventPayload
// > {
//   /**
//    * ドメインモデルのタイプ
//    */
//   readonly aggregateType: AggregateType

//   /**
//    * コマンドを実行（例外スタイルのエラーハンドリング）
//    */
//   execute(command: C): Promise<DomainEvent<P>[]>

//   /**
//    * 現在の状態を取得（例外スタイルのエラーハンドリング）
//    */
//   getState(id: AggregateId): Promise<S>

//   /**
//    * 新しいIDを生成
//    */
//   generateId(): AggregateId
// }

// /**
//  * Zodスキーマを使用したバリデーション関数の型
//  */
// export type Validator<T> = (data: unknown) => Result<T, ValidationError>
