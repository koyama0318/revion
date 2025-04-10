import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import type { AggregateId, AggregateType } from '../src/types/aggregate-id'
import type { Command } from '../src/types/command'
import type { DomainEvent } from '../src/types/domain-event'

// テストの共通セットアップ
beforeEach(() => {
  // テスト前のセットアップ
})

afterEach(() => {
  // テスト後のクリーンアップ
})

// グローバルなテストヘルパー
export const createMockCommand = (
  operation: string,
  aggregateType: AggregateType,
  aggregateId: AggregateId,
  payload?: unknown
): Command => ({
  operation,
  aggregateType,
  aggregateId,
  payload
})

export const createMockEvent = <Payload extends { eventType: string }>(
  eventType: string,
  aggregateType: AggregateType,
  aggregateId: AggregateId,
  payload: Payload,
  version: number
): DomainEvent<Payload> => ({
  eventId: 'test-event-id',
  eventType,
  aggregateType,
  aggregateId,
  version,
  payload,
  timestamp: new Date()
})

// テストユーティリティ
export const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))
