# API設計書

関連: [設計書](./02_design.md) / [DB設計書](./04_db-design.md) / [画面設計書](./03_screen-design.md)

実装: Next.js API Routes（Route Handlers）/ ベースパス: `/api`

---

## 1. 共通仕様

| 項目 | 内容 |
| ---- | ---- |
| 形式 | JSON（Content-Type: application/json）。CSVのみ text/csv |
| 文字コード | UTF-8 |
| 認証 | なし（ローカル単一ユーザー前提） |
| 日時 | ISO 8601 |

### 1.1 共通レスポンス（エラー）

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "title は必須です"
  }
}
```

### 1.2 HTTPステータス

| コード | 用途 |
| ------ | ---- |
| 200 | 取得・更新成功 |
| 201 | 作成成功 |
| 400 | バリデーションエラー |
| 404 | 対象なし |
| 409 | 状態競合（例: 実行中の二重操作） |
| 500 | サーバーエラー |

---

## 2. 評価テーマAPI

### `GET /api/cases`

評価テーマ一覧を取得する。

クエリ: `?category=開発`（任意フィルタ）

レスポンス 200:

```json
[
  {
    "id": 1,
    "title": "Terraform構築",
    "category": "開発",
    "prompt": "...",
    "rubricJson": null,
    "expectedOutput": null,
    "memo": null,
    "createdAt": "2026-06-01T00:00:00.000Z",
    "updatedAt": "2026-06-01T00:00:00.000Z"
  }
]
```

### `POST /api/cases`

評価テーマを作成する。

リクエスト:

```json
{
  "title": "Terraform構築",
  "category": "開発",
  "prompt": "AWS上にVPCとEC2を構築するTerraformを作成してください",
  "rubricJson": null,
  "expectedOutput": "main.tf 一式",
  "memo": null
}
```

- 必須: `title`, `category`, `prompt`
- レスポンス 201: 作成されたテーマ

### `GET /api/cases/:id`

評価テーマ詳細を取得する。レスポンス 200 / 404。

### `PUT /api/cases/:id`

評価テーマを更新する。リクエストは `POST` と同様。レスポンス 200 / 404。

### `DELETE /api/cases/:id`

評価テーマを削除する。レスポンス 200 / 404。

> 注: 紐づく実行履歴がある場合の扱い（論理削除 or 拒否）は実装で決定。MVPは物理削除を許容。

---

## 3. モデルAPI

### `GET /api/models`

モデル一覧を取得する。クエリ `?enabled=true` で有効モデルのみ。

レスポンス 200:

```json
[
  {
    "id": 1,
    "provider": "Anthropic",
    "modelName": "claude-opus-4-8",
    "displayName": "Claude Opus 4.8",
    "apiBaseUrl": null,
    "inputCostPer1k": 0.005,
    "outputCostPer1k": 0.025,
    "enabled": true
  }
]
```

### `POST /api/models`

モデルを登録する。

```json
{
  "provider": "OpenAI",
  "modelName": "gpt-5.1",
  "displayName": "GPT-5.1",
  "apiBaseUrl": null,
  "inputCostPer1k": 0.00125,
  "outputCostPer1k": 0.01,
  "enabled": true
}
```

- 必須: `provider`, `modelName`, `displayName`
- レスポンス 201

### `PUT /api/models/:id`

モデルを更新する（有効/無効切り替えを含む）。レスポンス 200 / 404。

### `DELETE /api/models/:id`

モデルを削除する。レスポンス 200 / 404。

---

## 4. 実行API

### `POST /api/runs`

ベンチマークを実行する。複数モデルへ同一プロンプトを送信し、Judge採点まで実施する。

リクエスト:

```json
{
  "caseId": 1,
  "modelIds": [1, 2, 3],
  "judgeModelId": 1,
  "repeatCount": 1
}
```

| フィールド | 必須 | 説明 |
| ---------- | :--: | ---- |
| caseId | ○ | 対象テーマID |
| modelIds | ○ | 実行対象モデルIDの配列 |
| judgeModelId | ○ | Judgeに使うモデルID |
| repeatCount | - | 繰り返し回数（既定1。MVPは1固定でも可） |

処理:

1. `benchmark_runs` を `status=running` で作成
2. `p-limit(3)` で各モデルへ並列実行（`Promise.allSettled`）
3. 各モデルの結果を `benchmark_run_results` に保存
4. 各成功結果を Judge LLM で採点し `benchmark_scores` に保存
5. `benchmark_runs.status=done`（全失敗時は `error`）

レスポンス 201:

```json
{
  "id": 10,
  "caseId": 1,
  "status": "running"
}
```

> 同期実行が長くなる場合は、`runId` を即時返し、`GET /api/runs/:id` のポーリングで進捗を取得する非同期方式を採用する。エラー処理は[設計書 §7](./02_design.md#7-エラー処理)に従う。

### `GET /api/runs`

実行履歴一覧を取得する。

レスポンス 200:

```json
[
  {
    "id": 10,
    "caseId": 1,
    "title": "Terraform構築",
    "status": "done",
    "startedAt": "2026-06-08T01:00:00.000Z",
    "finishedAt": "2026-06-08T01:00:35.000Z",
    "createdAt": "2026-06-08T01:00:00.000Z"
  }
]
```

### `GET /api/runs/:id`

実行詳細を取得する。結果・スコアをネストして返す。

レスポンス 200:

```json
{
  "id": 10,
  "title": "Terraform構築",
  "status": "done",
  "judge": { "provider": "Anthropic", "model": "claude-opus-4-8" },
  "results": [
    {
      "id": 100,
      "modelId": 2,
      "modelDisplayName": "Claude Opus 4.8",
      "response": "...",
      "latencyMs": 32000,
      "inputTokens": 1200,
      "outputTokens": 1800,
      "estimatedCost": 0.12,
      "status": "success",
      "errorMessage": null,
      "score": {
        "accuracy": 37,
        "coverage": 19,
        "practicality": 18,
        "readability": 9,
        "evidence": 9,
        "totalScore": 92,
        "judgeComment": "実装方針は妥当...",
        "rawJudgeResponse": null
      }
    }
  ]
}
```

- 失敗モデルは `status: "error"`、`errorMessage` に内容、`score: null`。

---

## 5. CSV出力API

### `GET /api/runs/:id/export`

実行結果をCSVで出力する。

レスポンス 200: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="run-10.csv"`

CSV列:

```text
評価テーマ,モデル名,回答,総合点,正確性,網羅性,実用性,可読性,根拠の明確さ,実行時間(ms),推定コスト,Judgeコメント
Terraform構築,Claude Opus 4.8,"...",92,37,19,18,9,9,32000,0.12,"実装方針は妥当..."
```

---

## 6. エラーコード一覧

| code | HTTP | 説明 |
| ---- | ---- | ---- |
| VALIDATION_ERROR | 400 | 必須項目欠落・型不正 |
| NOT_FOUND | 404 | 対象リソースなし |
| API_KEY_MISSING | 400 | 対象プロバイダーのAPIキー未設定 |
| RATE_LIMITED | 429 | 外部APIレート制限（リトライ後も失敗） |
| RUN_CONFLICT | 409 | 実行中の重複操作 |
| INTERNAL_ERROR | 500 | サーバー内部エラー |

> APIキー未設定の場合、実行前バリデーションで `API_KEY_MISSING` を返し、設定画面への誘導を行う。
