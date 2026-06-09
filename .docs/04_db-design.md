# DB設計書

関連: [設計書](./02_design.md) / [API設計書](./05_api-design.md)

DBMS: **SQLite** / ORM: **Prisma** / 保存先: `./data/benchmark.db`（Git管理外）

---

## 1. ER図

```text
benchmark_cases 1 ──< benchmark_runs 1 ──< benchmark_run_results 1 ──< benchmark_scores
                                                  │
benchmark_models 1 ───────────────────────────────┘
                      (run_result.model_id → models.id)
```

- `benchmark_cases` 1 : N `benchmark_runs`
- `benchmark_runs` 1 : N `benchmark_run_results`
- `benchmark_models` 1 : N `benchmark_run_results`
- `benchmark_run_results` 1 : N `benchmark_scores`（Judge複数化を見据えN対応）

---

## 2. テーブル定義

### 2.1 benchmark_cases（評価テーマ）

| カラム | 型 | 制約 | 説明 |
| ------ | -- | ---- | ---- |
| id | INTEGER | PK, AUTOINCREMENT | |
| title | TEXT | NOT NULL | タイトル |
| category | TEXT | NOT NULL | カテゴリ |
| prompt | TEXT | NOT NULL | プロンプト本文 |
| rubric_json | TEXT | | 評価観点（JSON文字列） |
| expected_output | TEXT | | 想定する成果物 |
| memo | TEXT | | 備考 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

```sql
CREATE TABLE benchmark_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  prompt TEXT NOT NULL,
  rubric_json TEXT,
  expected_output TEXT,
  memo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2.2 benchmark_models（比較対象モデル）

| カラム | 型 | 制約 | 説明 |
| ------ | -- | ---- | ---- |
| id | INTEGER | PK, AUTOINCREMENT | |
| provider | TEXT | NOT NULL | OpenAI / Anthropic / Google / OpenAI互換 |
| model_name | TEXT | NOT NULL | API上のモデル識別子 |
| display_name | TEXT | NOT NULL | 表示名 |
| api_base_url | TEXT | | OpenAI互換APIのベースURL |
| input_cost_per_1k | REAL | | 入力単価（1Kトークン） |
| output_cost_per_1k | REAL | | 出力単価（1Kトークン） |
| enabled | BOOLEAN | DEFAULT true | 有効/無効 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

```sql
CREATE TABLE benchmark_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  api_base_url TEXT,
  input_cost_per_1k REAL,
  output_cost_per_1k REAL,
  enabled BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2.3 benchmark_runs（実行単位）

| カラム | 型 | 制約 | 説明 |
| ------ | -- | ---- | ---- |
| id | INTEGER | PK, AUTOINCREMENT | |
| case_id | INTEGER | NOT NULL, FK→benchmark_cases.id | 対象テーマ |
| title | TEXT | NOT NULL | 実行タイトル（テーマ名のスナップショット） |
| status | TEXT | NOT NULL | running / done / error |
| started_at | DATETIME | | 実行開始 |
| finished_at | DATETIME | | 実行完了 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

```sql
CREATE TABLE benchmark_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at DATETIME,
  finished_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES benchmark_cases(id)
);
```

---

### 2.4 benchmark_run_results（モデルごとの回答）

| カラム | 型 | 制約 | 説明 |
| ------ | -- | ---- | ---- |
| id | INTEGER | PK, AUTOINCREMENT | |
| run_id | INTEGER | NOT NULL, FK→benchmark_runs.id | |
| model_id | INTEGER | NOT NULL, FK→benchmark_models.id | |
| response | TEXT | | 回答全文 |
| latency_ms | INTEGER | | 実行時間（ミリ秒） |
| input_tokens | INTEGER | | 入力トークン数 |
| output_tokens | INTEGER | | 出力トークン数 |
| estimated_cost | REAL | | 推定コスト |
| status | TEXT | NOT NULL | success / error |
| error_message | TEXT | | エラー内容 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

```sql
CREATE TABLE benchmark_run_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL,
  model_id INTEGER NOT NULL,
  response TEXT,
  latency_ms INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost REAL,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES benchmark_runs(id),
  FOREIGN KEY (model_id) REFERENCES benchmark_models(id)
);
```

---

### 2.5 benchmark_scores（Judge採点結果）

| カラム | 型 | 制約 | 説明 |
| ------ | -- | ---- | ---- |
| id | INTEGER | PK, AUTOINCREMENT | |
| result_id | INTEGER | NOT NULL, FK→benchmark_run_results.id | |
| judge_provider | TEXT | NOT NULL | Judgeのプロバイダー |
| judge_model | TEXT | NOT NULL | Judgeモデル名 |
| accuracy | INTEGER | | 正確性（40点満点） |
| coverage | INTEGER | | 網羅性（20点満点） |
| practicality | INTEGER | | 実用性（20点満点） |
| readability | INTEGER | | 可読性（10点満点） |
| evidence | INTEGER | | 根拠の明確さ（10点満点） |
| total_score | INTEGER | | 総合点（100点満点） |
| judge_comment | TEXT | | Judgeコメント |
| raw_judge_response | TEXT | | Judge生レスポンス（パース失敗時の保全） |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

```sql
CREATE TABLE benchmark_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  result_id INTEGER NOT NULL,
  judge_provider TEXT NOT NULL,
  judge_model TEXT NOT NULL,
  accuracy INTEGER,
  coverage INTEGER,
  practicality INTEGER,
  readability INTEGER,
  evidence INTEGER,
  total_score INTEGER,
  judge_comment TEXT,
  raw_judge_response TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (result_id) REFERENCES benchmark_run_results(id)
);
```

---

## 3. インデックス方針

| テーブル | インデックス | 目的 |
| -------- | ------------ | ---- |
| benchmark_runs | case_id | テーマ別の実行履歴取得 |
| benchmark_runs | status | 実行中の絞り込み |
| benchmark_run_results | run_id | 実行詳細での結果取得 |
| benchmark_run_results | model_id | モデル別集計 |
| benchmark_scores | result_id | 採点結果の紐付け取得 |

---

## 4. Prismaスキーマ

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:../data/benchmark.db"
}

model BenchmarkCase {
  id             Int      @id @default(autoincrement())
  title          String
  category       String
  prompt         String
  rubricJson     String?  @map("rubric_json")
  expectedOutput String?  @map("expected_output")
  memo           String?
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  runs           BenchmarkRun[]

  @@map("benchmark_cases")
}

model BenchmarkModel {
  id              Int      @id @default(autoincrement())
  provider        String
  modelName       String   @map("model_name")
  displayName     String   @map("display_name")
  apiBaseUrl      String?  @map("api_base_url")
  inputCostPer1k  Float?   @map("input_cost_per_1k")
  outputCostPer1k Float?   @map("output_cost_per_1k")
  enabled         Boolean  @default(true)
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  results         BenchmarkRunResult[]

  @@map("benchmark_models")
}

model BenchmarkRun {
  id         Int       @id @default(autoincrement())
  caseId     Int       @map("case_id")
  title      String
  status     String
  startedAt  DateTime? @map("started_at")
  finishedAt DateTime? @map("finished_at")
  createdAt  DateTime  @default(now()) @map("created_at")
  case       BenchmarkCase @relation(fields: [caseId], references: [id])
  results    BenchmarkRunResult[]

  @@index([caseId])
  @@index([status])
  @@map("benchmark_runs")
}

model BenchmarkRunResult {
  id             Int      @id @default(autoincrement())
  runId          Int      @map("run_id")
  modelId        Int      @map("model_id")
  response       String?
  latencyMs      Int?     @map("latency_ms")
  inputTokens    Int?     @map("input_tokens")
  outputTokens   Int?     @map("output_tokens")
  estimatedCost  Float?   @map("estimated_cost")
  status         String
  errorMessage   String?  @map("error_message")
  createdAt      DateTime @default(now()) @map("created_at")
  run            BenchmarkRun   @relation(fields: [runId], references: [id])
  model          BenchmarkModel @relation(fields: [modelId], references: [id])
  scores         BenchmarkScore[]

  @@index([runId])
  @@index([modelId])
  @@map("benchmark_run_results")
}

model BenchmarkScore {
  id               Int      @id @default(autoincrement())
  resultId         Int      @map("result_id")
  judgeProvider    String   @map("judge_provider")
  judgeModel       String   @map("judge_model")
  accuracy         Int?
  coverage         Int?
  practicality     Int?
  readability      Int?
  evidence         Int?
  totalScore       Int?     @map("total_score")
  judgeComment     String?  @map("judge_comment")
  rawJudgeResponse String?  @map("raw_judge_response")
  createdAt        DateTime @default(now()) @map("created_at")
  result           BenchmarkRunResult @relation(fields: [resultId], references: [id])

  @@index([resultId])
  @@map("benchmark_scores")
}
```

---

## 5. 初期データ（シード）

`prisma/seed.ts` で投入する。シードは既存の models/cases/runs/results/scores を一旦全削除してから再投入する**クリーンリセット方式**（`npm run seed`）。

### benchmark_models（直近約1年リリースの主要モデル 計14件）

| provider | 例（model_name / display_name） |
| -------- | ------------------------------- |
| Anthropic | `claude-opus-4-8`/Opus 4.8、`claude-opus-4-7`、`claude-opus-4-6`、`claude-sonnet-4-6`、`claude-haiku-4-5` |
| OpenAI | `gpt-5.1`、`gpt-5`、`gpt-5-mini`、`o3`、`o4-mini`、`gpt-4.1` |
| Google | `gemini-2.5-pro`、`gemini-2.5-flash`、`gemini-2.5-flash-lite` |

- **Claudeの単価は公式値**（per 1M を per 1K に換算）。
- **OpenAI / Google の単価は概算**であり、運用前にモデル管理画面で更新する。

### benchmark_cases（評価テーマ 計15件）

全カテゴリを網羅: 開発(3) / 調査(3) / 設計(4) / 障害解析(3) / ドキュメント作成(2)。

---

## 6. データ管理方針

- DBファイルは `./data/benchmark.db` に保存し、**Git管理外**とする。
- バックアップはDBファイルの手動コピー（エクスポート）とする。
- マイグレーションは Prisma Migrate で管理する。
