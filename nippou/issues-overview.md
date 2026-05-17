# Issue 一覧 — 営業日報システム

> 最終更新: 2026-04-20

## ステータス凡例

| 記号 | 意味 |
|---|---|
| ✅ | 完了（Issue クローズ・PR マージ済み） |
| 🔄 | PR レビュー中 |
| 🔵 | 未着手 |

---

## 🛠 Setup（環境構築）

| # | タイトル | ステータス |
|---|---|---|
| [#1](https://github.com/masasam26/nippou/issues/1) | PostgreSQL + Prisma マイグレーション設定 | ✅ 完了 |
| [#2](https://github.com/masasam26/nippou/issues/2) | バックエンド・フロントエンド `.env.example` 作成 | ✅ 完了 |
| [#3](https://github.com/masasam26/nippou/issues/3) | Express ミドルウェア基盤設定（CORS・JWT認証・エラーハンドリング） | 🔄 PR #25 レビュー中 |

---

## ⚙️ Backend — 認証・API

| # | タイトル | ステータス |
|---|---|---|
| [#4](https://github.com/masasam26/nippou/issues/4) | POST /auth/login・POST /auth/logout 実装 | 🔄 PR #26 レビュー中 |
| [#5](https://github.com/masasam26/nippou/issues/5) | GET・POST /daily-reports 実装 | 🔵 未着手 |
| [#6](https://github.com/masasam26/nippou/issues/6) | GET・PUT /daily-reports/:id・PATCH /daily-reports/:id/submit 実装 | 🔵 未着手 |
| [#7](https://github.com/masasam26/nippou/issues/7) | POST・DELETE /daily-reports/:id/comments 実装 | 🔵 未着手 |
| [#8](https://github.com/masasam26/nippou/issues/8) | GET・POST・PUT・DELETE /customers 顧客マスタAPI実装 | 🔵 未着手 |
| [#9](https://github.com/masasam26/nippou/issues/9) | GET・POST・PUT・PATCH /users 営業マスタAPI実装 | 🔵 未着手 |

---

## 🖥 Frontend — 画面実装

| # | タイトル | ステータス |
|---|---|---|
| [#17](https://github.com/masasam26/nippou/issues/17) | API クライアント・認証状態管理の実装 | 🔵 未着手 |
| [#10](https://github.com/masasam26/nippou/issues/10) | SCR-01 ログイン画面実装 | 🔵 未着手 |
| [#11](https://github.com/masasam26/nippou/issues/11) | SCR-02 ダッシュボード実装 | 🔵 未着手 |
| [#12](https://github.com/masasam26/nippou/issues/12) | SCR-03 日報作成・編集画面実装 | 🔵 未着手 |
| [#13](https://github.com/masasam26/nippou/issues/13) | SCR-04 日報詳細画面実装 | 🔵 未着手 |
| [#14](https://github.com/masasam26/nippou/issues/14) | SCR-05 日報一覧画面実装 | 🔵 未着手 |
| [#15](https://github.com/masasam26/nippou/issues/15) | SCR-06 顧客マスタ画面実装 | 🔵 未着手 |
| [#16](https://github.com/masasam26/nippou/issues/16) | SCR-07 営業マスタ画面実装 | 🔵 未着手 |

---

## 🧪 Testing — テスト実装

| # | タイトル | ステータス |
|---|---|---|
| [#18](https://github.com/masasam26/nippou/issues/18) | バックエンド単体テスト実装（バリデーション・ビジネスロジック） | 🔵 未着手 |
| [#19](https://github.com/masasam26/nippou/issues/19) | バックエンドAPIテスト実装（Supertest） | 🔵 未着手 |
| [#20](https://github.com/masasam26/nippou/issues/20) | フロントエンドコンポーネントテスト実装（React Testing Library） | 🔵 未着手 |
| [#21](https://github.com/masasam26/nippou/issues/21) | 結合テスト実装（主要シナリオ） | 🔵 未着手 |

---

## 🚀 CI/CD — デプロイ

| # | タイトル | ステータス |
|---|---|---|
| [#22](https://github.com/masasam26/nippou/issues/22) | GitHub Secrets 設定・Vercel デプロイ確認 | 🔵 未着手 |

---

## 進捗サマリー

| カテゴリ | 完了 | 進行中 | 未着手 | 合計 |
|---|---|---|---|---|
| Setup | 2 | 1 | 0 | 3 |
| Backend API | 0 | 1 | 5 | 6 |
| Frontend | 0 | 0 | 8 | 8 |
| Testing | 0 | 0 | 4 | 4 |
| CI/CD | 0 | 0 | 1 | 1 |
| **合計** | **2** | **2** | **18** | **22** |

## 推奨実装順序

```
#3 (ミドルウェア) → #4 (認証API) → #5〜#9 (各API) → #17 (APIクライアント)
→ #10 (ログイン) → #11 (ダッシュボード) → #12〜#16 (各画面)
→ #18〜#21 (テスト) → #22 (CI/CD)
```
