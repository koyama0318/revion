# Revion Toolkit

Event Sourcing と CQRS パターンのための簡素化されたツールキット

## 概要

Revion Toolkit は、[Revion Core](../revion-core) の機能をラップして、より簡単に使えるようにしたライブラリです。イベントソーシングとコマンドクエリ責務分離（CQRS）パターンを効率的に実装するための高レベル API を提供します。

## 特徴

- **シンプルな API** - イベントソーシングの複雑さを抽象化
- **Zod によるバリデーション** - コマンドとデータの検証を統合
- **ドメインサービス** - アグリゲートとコマンド処理を簡素化
- **イベントプロセッサ** - リードモデルの構築と管理を簡素化
- **型安全** - TypeScript による完全な型安全性

## インストール

```bash
# npmの場合
npm install revion-toolkit

# yarnの場合
yarn add revion-toolkit

# bunの場合
bun add revion-toolkit
```

## 基本的な使い方

```typescript
import { createDomainService, createEventProcessor } from "revion-toolkit";
import { z } from "zod";

// ドメインモデルの定義
const todoModel = {
  // 初期状態を生成する関数
  createInitialState: (type, id) => ({
    aggregateType: type,
    aggregateId: id,
    title: "",
    completed: false,
  }),

  // コマンドからイベントへの変換（デシーダー）
  decider: {
    createTodo: (state, command) => ({
      eventType: "todoCreated",
      title: command.payload.title,
    }),
    completeTodo: (state, command) => ({
      eventType: "todoCompleted",
    }),
  },

  // イベントの適用（リデューサー）
  reducer: (state, event) => {
    switch (event.payload.eventType) {
      case "todoCreated":
        return {
          ...state,
          title: event.payload.title,
        };
      case "todoCompleted":
        return {
          ...state,
          completed: true,
        };
      default:
        return state;
    }
  },
};

// バリデーションスキーマ
const todoValidation = {
  createTodo: z.object({
    title: z.string().min(1).max(100),
  }),
  completeTodo: z.object({}),
};

// ドメインサービスの作成
const todoService = createDomainService(
  "todo",
  todoModel,
  eventStore,
  todoValidation
);

// リードモデルの定義
const todoReadModel = {
  // イベントフィルタリング
  policy: {
    todoCreated: (event) => event,
    todoCompleted: (event) => event,
  },

  // イベント処理
  projection: {
    todoCreated: async (store, event) => {
      await store.save("todos", event.aggregateId, {
        id: event.aggregateId,
        title: event.payload.title,
        completed: false,
      });
    },
    todoCompleted: async (store, event) => {
      const todo = await store.get("todos", event.aggregateId);
      if (todo) {
        await store.save("todos", event.aggregateId, {
          ...todo,
          completed: true,
        });
      }
    },
  },
};

// イベントプロセッサの作成
const todoProcessor = createEventProcessor("todo", todoReadModel, dataStore);

// 使用例
async function createNewTodo(title) {
  const id = todoService.generateId();
  const events = await todoService.execute({
    commandId: todoService.generateId(),
    operation: "createTodo",
    aggregateType: "todo",
    aggregateId: id,
    payload: { title },
  });

  return id;
}
```

## 主要コンポーネント

- **ドメインサービス** (`createDomainService`) - コマンド処理とイベント生成
- **イベントプロセッサ** (`createEventProcessor`) - イベント処理と射影
- **バリデーション** (`createValidator`, `validate`) - Zod を使ったスキーマ検証

## ドキュメント

詳細なドキュメントは [ここ](https://github.com/koyama0318/revion) を参照してください。

## 貢献

プルリクエスト、バグ報告、機能リクエストを歓迎します。

## ライセンス

MIT ライセンスで提供されています。
