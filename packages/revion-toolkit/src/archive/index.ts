// console.log('revion-toolkit')

// // Re-export core functionality
// export * from 'revion-core'

// // Toolkit simplified APIs
// export { createDomainService } from './domain/aggregate'
// export { createEventProcessor, replayEvents } from './domain/event-listener'
// export { createValidator, validate, validateField } from './validation'

// // Toolkit types
// export type {
//   State,
//   Command,
//   Event,
//   DomainModel,
//   ReadModel,
//   ValidationSchema,
//   DomainService
// } from './types'
// export type { DomainServiceOptions } from './domain/aggregate'
// export type { EventProcessorOptions } from './domain/event-listener'

// // Version
// export const VERSION = '0.0.1'

// // Core機能のエクスポート
// // よく使われる型と関数を選択的に再エクスポート
// export type {
//   AggregateId,
//   AggregateType,
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

// // ツールキット用の型定義
// export type {
//   // ツールキット固有の型
//   DataStore,
//   ToolkitDomainModel,
//   ToolkitDomainService,
//   ToolkitReadModel,
//   ToolkitPolicy,
//   ToolkitProjection,
//   ValidationSchema,
//   Validator
// } from './types'

// // ドメイン関連の簡易API
// export {
//   createDomainService,
//   type DomainServiceOptions
// } from './domain/aggregate'

// // イベントリスナー関連の簡易API
// export {
//   createEventProcessor,
//   replayEvents,
//   type EventProcessorOptions
// } from './domain/event-listener'

// // バリデーション関連
// export {
//   createValidator,
//   validate,
//   validateField
// } from './validation'

// // 初期化メッセージ（デバッグ用）
// if (process.env.NODE_ENV !== 'production') {
//   console.log(`revion-toolkit v${VERSION} loaded`)
// }
