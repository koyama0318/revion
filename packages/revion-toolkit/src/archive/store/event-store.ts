import { type Result, err, ok } from 'neverthrow'

/**
 * インメモリイベントストア
 * 開発・テスト用の実装
 */
export class InMemoryEventStore<E extends Event> implements EventStore<E> {
  private events: Map<string, E[]> = new Map()
  private snapshots: Map<string, { state: unknown; version: number }> =
    new Map()

  /**
   * イベントストアのキーを生成
   */
  private getKey(aggregateType: AggregateType, id: ID): string {
    return `${aggregateType}:${id}`
  }

  /**
   * イベントを保存
   */
  async saveEvents(
    aggregateType: AggregateType,
    id: ID,
    events: E[]
  ): Promise<Result<void, AppError>> {
    if (events.length === 0) {
      return ok(undefined)
    }

    const key = this.getKey(aggregateType, id)
    const existingEvents = this.events.get(key) || []

    // 既存のイベントにマージ
    this.events.set(key, [...existingEvents, ...events])

    return ok(undefined)
  }

  /**
   * イベントを取得
   */
  async getEvents(
    aggregateType: AggregateType,
    id: ID,
    fromVersion = 0
  ): Promise<Result<E[], AppError>> {
    const key = this.getKey(aggregateType, id)
    const events = this.events.get(key) || []

    // バージョンでフィルタリング
    const filteredEvents = events.filter(
      event => (event.version || 0) > fromVersion
    )

    return ok(filteredEvents)
  }

  /**
   * すべてのイベントを取得
   */
  async getAllEvents(
    aggregateType: AggregateType
  ): Promise<Result<E[], AppError>> {
    // すべてのキーをイテレート
    const allEvents: E[] = []

    for (const [key, events] of this.events.entries()) {
      // キーパターンが一致するものを抽出
      if (key.startsWith(`${aggregateType}:`)) {
        allEvents.push(...events)
      }
    }

    // タイムスタンプでソート
    allEvents.sort((a, b) => {
      const aTime = a.timestamp ? a.timestamp.getTime() : 0
      const bTime = b.timestamp ? b.timestamp.getTime() : 0
      return aTime - bTime
    })

    return ok(allEvents)
  }

  /**
   * スナップショットを保存
   */
  async saveSnapshot<S extends State>(
    aggregateType: AggregateType,
    id: ID,
    state: S,
    version: number
  ): Promise<Result<void, AppError>> {
    const key = this.getKey(aggregateType, id)
    this.snapshots.set(key, { state, version })
    return ok(undefined)
  }

  /**
   * スナップショットを取得
   */
  async getSnapshot<S extends State>(
    aggregateType: AggregateType,
    id: ID
  ): Promise<Result<{ state: S; version: number } | null, AppError>> {
    const key = this.getKey(aggregateType, id)
    const snapshot = this.snapshots.get(key)

    if (!snapshot) {
      return ok(null)
    }

    return ok({
      state: snapshot.state as S,
      version: snapshot.version
    })
  }

  /**
   * イベントストアをクリア（テスト用）
   */
  clear(): void {
    this.events.clear()
    this.snapshots.clear()
  }
}
