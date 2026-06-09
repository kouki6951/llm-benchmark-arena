# 設計書（システム全体）

関連: [要件定義書](./01_requirements.md) / [画面設計書](./03_screen-design.md) / [DB設計書](./04_db-design.md) / [API設計書](./05_api-design.md)

---

## 1. システム概要

本アプリは、ユーザーが登録した評価テーマを複数のLLMモデルへ同時実行し、その回答を保存する。その後、固定したJudge LLMによりRubric評価を行い、モデルごとのスコアを可視化する。

クラウドインフラを使わず、個人PC上で完結するLLM比較基盤である。LLM推論のみ外部APIを利用し、評価テーマ・回答・採点結果はすべてローカルDBに保存する。

---

## 2. システム構成

```text
個人PC
├─ Web UI            … Next.js (App Router) + React + Tailwind + Recharts
├─ Backend API       … Next.js API Routes (Node.js / TypeScript)
├─ SQLite DB         … Prisma ORM 経由でアクセス（./data/benchmark.db）
├─ 実行オーケストレータ … 並列実行制御（p-limit / Promise.allSettled / AbortController）
├─ Judge評価処理     … Judge LLM呼び出し + JSONパース + スコア保存
└─ CSV出力          … 実行結果のCSV化・ダウンロード

外部LLM API
├─ OpenAI API
├─ Anthropic API
├─ Gemini API
└─ その他LLM API（OpenAI互換）
```

### 2.1 レイヤ構成

| レイヤ | 役割 | 主な実装 |
| ------ | ---- | -------- |
| プレゼンテーション | 画面表示・ユーザー操作 | `app/` の各ページ、`components/` |
| API（コントローラ） | HTTPエンドポイント | `app/api/` の Route Handlers |
| ドメイン/サービス | 実行制御・採点・コスト計算 | `lib/llm/`, `lib/judge.ts`, `lib/cost.ts`, `lib/csv.ts` |
| データアクセス | DB CRUD | `lib/prisma.ts`, `prisma/schema.prisma` |
| 外部連携 | LLM API呼び出し | `lib/llm/openai.ts` 他、共通IF `lib/llm/index.ts` |

---

## 3. 技術構成

### 3.1 フロントエンド

- Next.js（App Router）
- React
- Tailwind CSS
- Recharts（スコアの可視化）

### 3.2 バックエンド

- Next.js API Routes（Route Handlers）
- Node.js
- TypeScript

### 3.3 DB

- SQLite
- Prisma ORM

### 3.4 外部API連携

- OpenAI SDK
- Anthropic SDK
- Google Generative AI SDK
- OpenAI互換API用の共通クライアント

### 3.5 実行制御

- `Promise.allSettled` — 一部失敗時も他の結果を確保する
- `p-limit` — 同時実行数を制限する
- `AbortController` — タイムアウト・中断制御

---

## 4. 主要処理フロー

### 4.1 ベンチマーク実行フロー

```text
[ユーザー] 評価テーマ + 対象モデル + Judgeモデルを選択し実行
   │
   ▼
[API] POST /api/runs
   │  1. benchmark_runs を status=running で作成
   │  2. 対象モデルを取得
   ▼
[オーケストレータ] p-limit(3) で並列実行
   │  各モデルごとに:
   │    a. LLMクライアント解決（プロバイダー別）
   │    b. プロンプト送信（AbortControllerでタイムアウト管理）
   │    c. latency / tokens を計測
   │    d. cost を推定（lib/cost.ts）
   │    e. benchmark_run_results に保存（成功/失敗どちらも）
   ▼
[Judge処理] 各成功回答に対して Judge LLM を呼び出し
   │    a. Judgeプロンプト生成
   │    b. JSONパース（失敗時 raw を保存）
   │    c. benchmark_scores に保存
   ▼
[API] benchmark_runs を status=done に更新
   ▼
[UI] 実行詳細画面でスコア・回答・コメントを表示
```

### 4.2 共通LLMインターフェース

プロバイダー差異を吸収する共通インターフェースを定義する。

```ts
// lib/llm/index.ts（イメージ）
export interface LlmRequest {
  model: string;
  prompt: string;
  apiBaseUrl?: string;
  signal?: AbortSignal;
}

export interface LlmResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export interface LlmClient {
  generate(req: LlmRequest): Promise<LlmResponse>;
}

// provider 文字列で openai / anthropic / gemini / openai-compatible を解決
export function resolveClient(provider: string): LlmClient;
```

各プロバイダー実装（`openai.ts` / `anthropic.ts` / `gemini.ts`）は `LlmClient` を満たす。OpenAI互換APIは `openai.ts` に `apiBaseUrl` を渡して再利用する。

---

## 5. 実行制御

### 5.1 同時実行数

```text
最大同時実行数: 3
```

理由:

- APIレート制限を避ける
- コスト暴発を防ぐ
- PC側の処理負荷を抑える

`p-limit(3)` でモデル呼び出しをラップする。Judge採点も同様に制限する。

### 5.2 タイムアウト・中断

- 各LLM呼び出しは `AbortController` でタイムアウト（例: 120秒）を設定する。
- タイムアウト時は該当モデルのみ失敗扱いとし、他モデルの結果は保持する。

### 5.3 失敗時のハンドリング

`Promise.allSettled` を用い、一部モデルが失敗しても実行全体は継続する。失敗したモデルは `benchmark_run_results.status = error` と `error_message` を保存する。

---

## 6. Judgeプロンプト設計

```text
あなたは厳格な技術評価者です。

以下の評価テーマに対するLLMの回答を採点してください。

# 評価テーマ
{{prompt}}

# 回答
{{response}}

# 評価基準
- 正確性: 40点
- 網羅性: 20点
- 実用性: 20点
- 可読性: 10点
- 根拠の明確さ: 10点

# 出力形式
必ず以下のJSON形式のみで返してください。

{
  "accuracy": number,
  "coverage": number,
  "practicality": number,
  "readability": number,
  "evidence": number,
  "total": number,
  "comment": string
}
```

### 6.1 JSONパース方針

- レスポンスからJSON部分を抽出してパースする。
- パース失敗時は `raw_judge_response` に原文を保存し、スコアはnullとして記録する。
- `total` はLLM出力値を保存しつつ、各項目の合計と乖離がある場合は警告ログを残す（サーバー側で再計算した値を採用してもよい）。

---

## 7. エラー処理

| エラー | 対応 |
| ------ | ---- |
| APIキー未設定 | 設定画面で警告表示。実行前バリデーションで弾く |
| レート制限（429） | 一定時間待機後リトライ（指数バックオフ） |
| モデル名不正 | エラーとして `benchmark_run_results` に保存 |
| JSONパース失敗 | `raw_judge_response` を保存 |
| 通信失敗 | 対象モデルのみ失敗扱い |
| 一部モデル失敗 | 他モデルの結果は保存 |

---

## 8. コスト計算

`lib/cost.ts` で推定コストを算出する。

```text
推定コスト = (input_tokens / 1000) * input_cost_per_1k
           + (output_tokens / 1000) * output_cost_per_1k
```

単価は `benchmark_models` に登録された値を使用する。通貨はドル基準とする。

---

## 9. ディレクトリ構成

詳細は[実装計画書](./06_implementation-plan.md#ディレクトリ構成)を参照。

```text
llm-benchmark-arena/
├─ app/            … 画面 + API Routes
├─ components/     … UIコンポーネント
├─ lib/            … LLM連携・Judge・コスト・CSV・Prisma
├─ prisma/         … schema.prisma
├─ data/           … benchmark.db（Git管理外）
├─ .env.local      … APIキー（Git管理外）
├─ package.json
└─ README.md
```

---

## 10. 将来拡張の設計上の配慮

| 拡張 | 設計上の配慮 |
| ---- | ------------ |
| 複数回実行 | `benchmark_run_results` に同一(run_id, model_id)の複数行を許容できる構造とする |
| Judge複数化 | `benchmark_scores` は1回答に複数行を許容（judge_provider/model 単位） |
| ELOレーティング | 回答ペア比較用の対戦テーブルを追加で拡張可能 |
| テンプレート | `benchmark_cases` をテンプレート起点に複製する機能を追加可能 |
