# 実装 TODO

## バグ修正

- [x] **チャット履歴がページリロード後に消える**  
  `page.tsx` の `useChat` に `initialMessages` が渡されていない。  
  ページ初期化時に `/api/conversations/:sessionId` を叩いて取得した履歴を `useChat` の `initialMessages` に渡す必要がある。

- [x] **管理画面のメッセージが表示されない**  
  `admin/page.tsx` の `Message` 型が `content: string` を想定しているが、APIが返すのはAI SDK v5形式（`parts[]` を持つオブジェクト）。  
  `m.content` → `m.parts?.find(p => p.type === "text")?.text` に変更する。

- [x] **HTMLの `lang` 属性が英語になっている**  
  `layout.tsx` の `<html lang="en">` → `<html lang="ja">` に変更。

- [x] **ページタイトル・メタデータがデフォルトのまま**  
  `layout.tsx` の `metadata` を "AIチャット" に更新する。

---

## 機能追加

- [x] **新しい会話を始めるボタン**  
  チャット画面に「会話をリセット」ボタンを追加し、`localStorage` の sessionId を新しい UUID に更新してページをリロードする。

- [x] **チャット送信エラー時のUI**  
  ネットワークエラーやAPI障害時にエラーメッセージをチャット画面に表示する。

---

## インフラ・デプロイ

- [x] **MongoDB Atlas クラスターのセットアップ**  
  MongoDB Atlas で無料クラスターを作成し、接続文字列を取得する。  
  `.env.local` の `MONGODB_URI` と `MONGODB_DB_NAME` を設定する。

- [x] **`.env.local` の全環境変数を設定**  
  - [x] `ANTHROPIC_API_KEY` — 設定済み
  - [x] `MONGODB_URI` — 設定済み
  - [x] `MONGODB_DB_NAME` — `ai-chat` に設定済み
  - [x] `ADMIN_SECRET` — 設定済み

- [x] **ローカル動作確認**  
  `npm run dev` でサーバーを起動し、以下を確認済み：
  - チャットAPIがストリーミング応答を返す（200 OK）
  - 会話履歴がMongoDBから正しく取得できる
  - `/api/admin/conversations` が認証・スレッド一覧を正常に返す

- [x] **Vercel デプロイ設定** — `vercel.json` 作成・Vercel CLI インストール済み  
  残り手動手順：
  1. `! npx vercel login` でログイン
  2. `! npx vercel` でプロジェクト作成・初回デプロイ
  3. Vercel ダッシュボードで環境変数（`ANTHROPIC_API_KEY` / `MONGODB_URI` / `MONGODB_DB_NAME` / `ADMIN_SECRET`）を設定
  4. `! npx vercel --prod` で本番デプロイ

---

## 完了済み

- [x] Next.js 16 + App Router プロジェクト構成
- [x] Hono APIルート（`/api/chat`, `/api/conversations/:sessionId`, `/api/admin/conversations`, `/api/admin/conversations/:threadId`）
- [x] Mastra エージェント（遅延初期化、MongoDB メモリ）
- [x] チャットUI（ストリーミング応答、自動スクロール）
- [x] 管理画面UI（シークレット認証、スレッド一覧・詳細表示）
- [x] セッション管理（`localStorage` UUID）
- [x] shadcn/ui コンポーネント群
- [x] `.env.local.example`
- [x] `CLAUDE.md` ドキュメント
