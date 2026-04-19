# API仕様書 — 営業日報システム

## 基本情報

| 項目 | 値 |
|---|---|
| Base URL | `https://api.example.com/v1` |
| 認証方式 | Bearer Token（JWT） |
| Content-Type | `application/json` |
| 文字コード | UTF-8 |

## 共通仕様

### 認証ヘッダー

```
Authorization: Bearer {token}
```

ログイン以外の全エンドポイントで必須。

### 共通レスポンス形式

**成功時**
```json
{
  "data": { ... }
}
```

**エラー時**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": [
      { "field": "email", "message": "メール形式で入力してください" }
    ]
  }
}
```

### 共通エラーコード

| HTTPステータス | コード | 説明 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 入力値不正 |
| 401 | `UNAUTHORIZED` | 未認証 |
| 403 | `FORBIDDEN` | 権限不足 |
| 404 | `NOT_FOUND` | リソースが存在しない |
| 409 | `CONFLICT` | 一意制約違反など |
| 500 | `INTERNAL_SERVER_ERROR` | サーバーエラー |

---

## 1. 認証 `/auth`

### POST `/auth/login`

ログイン。JWTトークンを返す。

**Request Body**
```json
{
  "email": "yamada@example.com",
  "password": "password123"
}
```

**Response `200`**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": 1,
      "name": "山田 太郎",
      "email": "yamada@example.com",
      "role": "sales"
    }
  }
}
```

**エラー**
| ステータス | コード | 条件 |
|---|---|---|
| 401 | `UNAUTHORIZED` | メールアドレスまたはパスワードが不一致 |

---

### POST `/auth/logout`

ログアウト。サーバー側でトークンを無効化する。

**Response `204`** ボディなし

---

## 2. 日報 `/daily-reports`

### GET `/daily-reports`

日報一覧を取得する。

**Query Parameters**

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `user_id` | integer | — | 担当者で絞り込み。上長のみ他ユーザー指定可 |
| `date_from` | date (YYYY-MM-DD) | — | 期間開始 |
| `date_to` | date (YYYY-MM-DD) | — | 期間終了 |
| `status` | string | — | `draft` または `submitted` |
| `page` | integer | — | ページ番号（デフォルト: 1） |
| `per_page` | integer | — | 1ページあたり件数（デフォルト: 20、最大: 100） |

**Response `200`**
```json
{
  "data": {
    "items": [
      {
        "report_id": 1,
        "user": {
          "user_id": 1,
          "name": "山田 太郎"
        },
        "report_date": "2026-04-18",
        "status": "submitted",
        "visit_count": 3,
        "created_at": "2026-04-18T09:00:00Z",
        "updated_at": "2026-04-18T17:30:00Z"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "per_page": 20,
      "total_pages": 3
    }
  }
}
```

**権限**
- `sales`：自分の日報のみ取得可（`user_id` 指定は無視）
- `manager`：全ユーザーの日報を取得可

---

### POST `/daily-reports`

日報を新規作成する。

**Request Body**
```json
{
  "report_date": "2026-04-18",
  "visit_records": [
    {
      "customer_id": 10,
      "visit_content": "初回提案。見積もり依頼あり。",
      "visit_order": 1
    },
    {
      "customer_id": 15,
      "visit_content": "フォローアップ。次回アポ設定。",
      "visit_order": 2
    }
  ],
  "problem": "○○社の競合他社の提案内容が不明。情報収集の方法を相談したい。",
  "plan": "・○○社に見積書を送付\n・△△社へ電話フォロー",
  "status": "draft"
}
```

**バリデーション**
- `report_date`：必須、YYYY-MM-DD形式
- `visit_records[].customer_id`：必須、顧客マスタに存在するIDであること
- `visit_records[].visit_content`：必須、最大1000文字
- `problem`：最大2000文字
- `plan`：最大2000文字
- `status`：`draft` または `submitted`
- 同一 `(user_id, report_date)` の日報が既に存在する場合は `409`

**Response `201`**
```json
{
  "data": {
    "report_id": 1,
    "user": {
      "user_id": 1,
      "name": "山田 太郎"
    },
    "report_date": "2026-04-18",
    "visit_records": [
      {
        "visit_id": 1,
        "customer": {
          "customer_id": 10,
          "company_name": "株式会社○○"
        },
        "visit_content": "初回提案。見積もり依頼あり。",
        "visit_order": 1
      },
      {
        "visit_id": 2,
        "customer": {
          "customer_id": 15,
          "company_name": "株式会社△△"
        },
        "visit_content": "フォローアップ。次回アポ設定。",
        "visit_order": 2
      }
    ],
    "problem": "○○社の競合他社の提案内容が不明。情報収集の方法を相談したい。",
    "plan": "・○○社に見積書を送付\n・△△社へ電話フォロー",
    "status": "draft",
    "comments": [],
    "created_at": "2026-04-18T09:00:00Z",
    "updated_at": "2026-04-18T09:00:00Z"
  }
}
```

**権限**
- `sales` のみ作成可

---

### GET `/daily-reports/:report_id`

日報の詳細を取得する。

**Path Parameters**

| パラメータ | 型 | 説明 |
|---|---|---|
| `report_id` | integer | 日報ID |

**Response `200`**
```json
{
  "data": {
    "report_id": 1,
    "user": {
      "user_id": 1,
      "name": "山田 太郎"
    },
    "report_date": "2026-04-18",
    "visit_records": [
      {
        "visit_id": 1,
        "customer": {
          "customer_id": 10,
          "company_name": "株式会社○○"
        },
        "visit_content": "初回提案。見積もり依頼あり。",
        "visit_order": 1
      }
    ],
    "problem": "○○社の競合他社の提案内容が不明。",
    "plan": "・○○社に見積書を送付",
    "status": "submitted",
    "comments": [
      {
        "comment_id": 1,
        "user": {
          "user_id": 2,
          "name": "鈴木 部長"
        },
        "body": "競合情報は営業部の共有フォルダを確認してみてください。",
        "created_at": "2026-04-18T18:30:00Z"
      }
    ],
    "created_at": "2026-04-18T09:00:00Z",
    "updated_at": "2026-04-18T17:30:00Z"
  }
}
```

**権限**
- `sales`：自分の日報のみ取得可
- `manager`：全ユーザーの日報を取得可

---

### PUT `/daily-reports/:report_id`

日報を更新する。`status=submitted` の日報は更新不可。

**Request Body**（POST `/daily-reports` と同形式）

**Response `200`**（GET `/daily-reports/:report_id` と同形式）

**エラー**
| ステータス | コード | 条件 |
|---|---|---|
| 403 | `FORBIDDEN` | 他ユーザーの日報を編集しようとした |
| 409 | `CONFLICT` | `status=submitted` の日報を編集しようとした |

**権限**
- 日報の作成者本人のみ、かつ `status=draft` の場合のみ更新可

---

### PATCH `/daily-reports/:report_id/submit`

日報を提出済みに変更する。

**Request Body** なし

**Response `200`**
```json
{
  "data": {
    "report_id": 1,
    "status": "submitted",
    "updated_at": "2026-04-18T17:30:00Z"
  }
}
```

**権限**
- 日報の作成者本人のみ

---

## 3. コメント `/daily-reports/:report_id/comments`

### POST `/daily-reports/:report_id/comments`

日報にコメントを投稿する。

**Request Body**
```json
{
  "body": "競合情報は営業部の共有フォルダを確認してみてください。"
}
```

**バリデーション**
- `body`：必須、最大1000文字

**Response `201`**
```json
{
  "data": {
    "comment_id": 1,
    "report_id": 1,
    "user": {
      "user_id": 2,
      "name": "鈴木 部長"
    },
    "body": "競合情報は営業部の共有フォルダを確認してみてください。",
    "created_at": "2026-04-18T18:30:00Z"
  }
}
```

**権限**
- `manager` のみ投稿可

---

### DELETE `/daily-reports/:report_id/comments/:comment_id`

コメントを削除する。

**Response `204`** ボディなし

**権限**
- コメントの投稿者本人のみ

---

## 4. 顧客マスタ `/customers`

### GET `/customers`

顧客一覧を取得する。

**Query Parameters**

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `q` | string | — | 会社名での部分一致検索 |
| `page` | integer | — | ページ番号（デフォルト: 1） |
| `per_page` | integer | — | 件数（デフォルト: 20、最大: 100） |

**Response `200`**
```json
{
  "data": {
    "items": [
      {
        "customer_id": 10,
        "company_name": "株式会社○○",
        "contact_name": "田中 一郎",
        "address": "東京都渋谷区○○1-2-3",
        "phone": "03-1234-5678",
        "created_at": "2026-01-10T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 80,
      "page": 1,
      "per_page": 20,
      "total_pages": 4
    }
  }
}
```

**権限**
- 全ロール取得可

---

### POST `/customers`

顧客を新規登録する。

**Request Body**
```json
{
  "company_name": "株式会社○○",
  "contact_name": "田中 一郎",
  "address": "東京都渋谷区○○1-2-3",
  "phone": "03-1234-5678"
}
```

**バリデーション**
- `company_name`：必須、最大100文字
- `contact_name`：最大50文字
- `address`：最大200文字
- `phone`：数字・ハイフンのみ

**Response `201`**
```json
{
  "data": {
    "customer_id": 10,
    "company_name": "株式会社○○",
    "contact_name": "田中 一郎",
    "address": "東京都渋谷区○○1-2-3",
    "phone": "03-1234-5678",
    "created_at": "2026-04-18T10:00:00Z"
  }
}
```

**権限**
- `manager` のみ

---

### GET `/customers/:customer_id`

顧客詳細を取得する。

**Response `200`**（POST `/customers` レスポンスと同形式）

**権限**
- 全ロール取得可

---

### PUT `/customers/:customer_id`

顧客情報を更新する。

**Request Body**（POST `/customers` と同形式）

**Response `200`**（POST `/customers` レスポンスと同形式）

**権限**
- `manager` のみ

---

### DELETE `/customers/:customer_id`

顧客を削除する。

**Response `204`** ボディなし

**エラー**
| ステータス | コード | 条件 |
|---|---|---|
| 409 | `CONFLICT` | 訪問記録に紐づいている顧客を削除しようとした |

**権限**
- `manager` のみ

---

## 5. 営業マスタ `/users`

### GET `/users`

ユーザー一覧を取得する。

**Query Parameters**

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `role` | string | — | `sales` または `manager` で絞り込み |
| `is_active` | boolean | — | `true`（デフォルト）で有効ユーザーのみ |

**Response `200`**
```json
{
  "data": {
    "items": [
      {
        "user_id": 1,
        "name": "山田 太郎",
        "email": "yamada@example.com",
        "role": "sales",
        "is_active": true,
        "created_at": "2026-01-01T00:00:00Z"
      }
    ]
  }
}
```

**権限**
- `manager` のみ

---

### POST `/users`

ユーザーを新規登録する。

**Request Body**
```json
{
  "name": "山田 太郎",
  "email": "yamada@example.com",
  "role": "sales",
  "password": "password123"
}
```

**バリデーション**
- `name`：必須、最大50文字
- `email`：必須、メール形式、重複不可
- `role`：必須、`sales` または `manager`
- `password`：必須、8文字以上

**Response `201`**
```json
{
  "data": {
    "user_id": 1,
    "name": "山田 太郎",
    "email": "yamada@example.com",
    "role": "sales",
    "is_active": true,
    "created_at": "2026-04-18T10:00:00Z"
  }
}
```

**権限**
- `manager` のみ

---

### GET `/users/:user_id`

ユーザー詳細を取得する。

**Response `200`**（POST `/users` レスポンスと同形式）

**権限**
- `manager` のみ

---

### PUT `/users/:user_id`

ユーザー情報を更新する。パスワードは本エンドポイントでは変更不可。

**Request Body**
```json
{
  "name": "山田 太郎",
  "email": "yamada@example.com",
  "role": "sales"
}
```

**Response `200`**（POST `/users` レスポンスと同形式）

**権限**
- `manager` のみ

---

### PATCH `/users/:user_id/deactivate`

ユーザーを無効化する（論理削除）。

**Request Body** なし

**Response `200`**
```json
{
  "data": {
    "user_id": 1,
    "is_active": false
  }
}
```

**エラー**
| ステータス | コード | 条件 |
|---|---|---|
| 409 | `CONFLICT` | 自分自身を無効化しようとした |

**権限**
- `manager` のみ

---

## エンドポイント一覧

| メソッド | パス | 説明 | 権限 |
|---|---|---|---|
| POST | `/auth/login` | ログイン | 全員 |
| POST | `/auth/logout` | ログアウト | 全員 |
| GET | `/daily-reports` | 日報一覧 | 全員 |
| POST | `/daily-reports` | 日報作成 | sales |
| GET | `/daily-reports/:id` | 日報詳細 | 全員 |
| PUT | `/daily-reports/:id` | 日報更新 | sales（本人・下書きのみ） |
| PATCH | `/daily-reports/:id/submit` | 日報提出 | sales（本人のみ） |
| POST | `/daily-reports/:id/comments` | コメント投稿 | manager |
| DELETE | `/daily-reports/:id/comments/:id` | コメント削除 | manager（本人のみ） |
| GET | `/customers` | 顧客一覧 | 全員 |
| POST | `/customers` | 顧客登録 | manager |
| GET | `/customers/:id` | 顧客詳細 | 全員 |
| PUT | `/customers/:id` | 顧客更新 | manager |
| DELETE | `/customers/:id` | 顧客削除 | manager |
| GET | `/users` | ユーザー一覧 | manager |
| POST | `/users` | ユーザー登録 | manager |
| GET | `/users/:id` | ユーザー詳細 | manager |
| PUT | `/users/:id` | ユーザー更新 | manager |
| PATCH | `/users/:id/deactivate` | ユーザー無効化 | manager |
