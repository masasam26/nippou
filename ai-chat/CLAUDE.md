# CLAUDE.md

このファイルはClaude Code (claude.ai/code) がこのリポジトリで作業する際のガイドです。

---

## プロジェクト概要

日本語専用の一般公開向けAIチャットボット。ログイン不要で誰でも利用でき、会話履歴はMongoDBに永続保存される。管理者向けに簡易的な会話ログ閲覧画面も提供する。

---

## 技術スタック

| 領域 | 技術 |
|------|------|
| フレームワーク | Next.js 16 (App Router) |
| APIサーバー | Hono (`hono/vercel`) |
| AIエージェント | Mastra (`@mastra/core`, `@mastra/memory`) |
| AIモデル | Claude Sonnet 4.6 (Anthropic) |
| ストリーミング | AI SDK (`ai`, `@ai-sdk/react`, `@mastra/ai-sdk`) |
| データベース | MongoDB Atlas (`@mastra/mongodb`) |
| UIライブラリ | shadcn/ui + Tailwind CSS v4 |
| デプロイ | Vercel |

> **注意:** Prismaは使用していない。会話データはMastraの`MongoDBStore`が管理するため不要。

---

## 主要機能

### ユーザー向け
- 日本語でのAIとの対話（マルチターン会話）
- 会話履歴の永続保存（ブラウザを閉じても次回アクセス時に履歴が残る）
- ログイン不要（`localStorage`にUUIDを保存してセッション識別）
- レート制限なし

### 管理者向け
- `/admin` ページで全ユーザーの会話ログを閲覧可能（シークレット認証）

---

## ディレクトリ構成

```
src/
├── app/
│   ├── page.tsx                     # チャット画面（メイン）
│   ├── admin/
│   │   └── page.tsx                 # 管理画面（会話ログ一覧）
│   ├── api/
│   │   └── [[...route]]/
│   │       └── route.ts             # Hono APIルートハンドラ
│   └── globals.css
├── components/ui/                   # shadcn/ui コンポーネント
├── lib/
│   ├── session.ts                   # セッションID管理（localStorage）
│   └── utils.ts
└── mastra/
    └── index.ts                     # Mastraエージェント・メモリ設定（遅延初期化）
```

---

## APIルート（Hono）

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/chat` | メッセージ送信・ストリーミング応答 |
| GET | `/api/conversations/:sessionId` | セッションの会話履歴取得 |
| GET | `/api/admin/conversations` | 全会話スレッド一覧（管理画面用） |
| GET | `/api/admin/conversations/:threadId` | 特定会話の詳細（管理画面用） |

管理APIは `x-admin-secret` ヘッダーで認証する。

---

## 環境変数

`.env.local` に設定（`.env.local.example` を参照）：

```
ANTHROPIC_API_KEY=       # Claude APIキー
MONGODB_URI=             # MongoDB Atlas接続文字列
MONGODB_DB_NAME=         # DB名（省略時: "ai-chat"）
ADMIN_SECRET=            # 管理画面アクセス用シークレット
```

Vercelにデプロイする際はVercelダッシュボードで環境変数を設定すること。

---

## 開発上の注意点

- `src/mastra/index.ts` のMastraインスタンスは遅延初期化（`getMastra()`）。ビルド時に`MONGODB_URI`が不要になる
- セッション識別は `localStorage` の UUID で行う（ログイン不要のため）
- 管理画面の認証は `x-admin-secret` ヘッダーによる簡易認証
- チャットUIはAI SDK v5の `useChat` + `DefaultChatTransport` を使用
- メッセージ本文は `message.parts` から `type === "text"` のものを取得する

---

## コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# shadcn/ui コンポーネント追加
npx shadcn@latest add <component>
```
