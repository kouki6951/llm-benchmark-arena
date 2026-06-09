# 実装計画書

関連: [要件定義書](./01_requirements.md) / [設計書](./02_design.md) / [DB設計書](./04_db-design.md) / [API設計書](./05_api-design.md)

---

## 1. 開発方針

- MVPスコープ（[要件定義書 §6](./01_requirements.md#6-mvpスコープ)）を最優先で完成させる。
- LLM連携は共通インターフェースで抽象化し、プロバイダー追加を容易にする。
- 各ステップで動作確認しながら積み上げる。

---

## 2. ディレクトリ構成

```text
llm-benchmark-arena/
├─ app/
│  ├─ dashboard/        # /dashboard
│  ├─ cases/            # /cases, /cases/new, /cases/[id]
│  ├─ models/           # /models
│  ├─ runs/             # /runs, /runs/[id]
│  ├─ settings/         # /settings
│  └─ api/
│     ├─ cases/         # GET/POST/PUT/DELETE
│     ├─ models/        # GET/POST/PUT/DELETE
│     ├─ runs/          # POST/GET + [id] + [id]/export
│     └─ export/
│
├─ components/
│  ├─ CaseForm.tsx        # テーマ登録/編集フォーム
│  ├─ ModelForm.tsx       # モデル登録/編集フォーム
│  ├─ ModelManager.tsx    # モデル一覧・有効無効トグル・追加/編集/削除
│  ├─ RunLauncher.tsx     # テーマ詳細の実行ランチャー
│  ├─ ScoreChart.tsx      # モデル別総合点の棒グラフ（Recharts）
│  ├─ ResponseAccordion.tsx # 採点根拠カード内の「回答を確認する」アコーディオン
│  ├─ DeleteButton.tsx    # 確認付き削除ボタン（汎用）
│  └─ hud/                # コントロールルーム風HUD共通UI（09_ui-design-system.md）
│     ├─ GridBackground.tsx
│     ├─ HudPanel.tsx     # 斜めカット＋コーナーマーカー
│     ├─ CommandBar.tsx   # 最上部コマンドバー
│     ├─ SideNav.tsx      # サイドナビ（現在ページ発光）
│     ├─ PageHeader.tsx   # 画面見出し（英字コード＋日本語）
│     ├─ StatusBadge.tsx  # SYSTEM ONLINE / ANALYZING / WARNING / ERROR
│     ├─ HexIcon.tsx      # 六角形アイコン枠
│     └─ NeonButton.tsx   # 蛍光グリーン/赤の発光ボタン
│
├─ lib/
│  ├─ llm/
│  │  ├─ openai.ts       # OpenAI / OpenAI互換
│  │  ├─ anthropic.ts
│  │  ├─ gemini.ts
│  │  ├─ types.ts        # 共通IF・ApiKeyMissingError
│  │  └─ index.ts        # resolveClient・APIキー判定
│  ├─ judge.ts           # Judgeプロンプト生成・採点・JSONパース
│  ├─ runner.ts          # 一括実行オーケストレータ（p-limit/allSettled）
│  ├─ cost.ts            # 推定コスト計算
│  ├─ csv.ts             # CSV生成
│  ├─ api.ts             # APIエラーレスポンス共通化
│  ├─ constants.ts       # カテゴリ・プロバイダー定義
│  └─ prisma.ts          # PrismaClient シングルトン
│
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts            # 初期モデル14件＋評価テーマ15件
│
├─ data/
│  └─ benchmark.db       # Git管理外
│
├─ .env.local            # APIキー（Git管理外）
├─ .env.local.example    # APIキー設定テンプレート
├─ .gitignore            # data/ , .env.local を除外
├─ package.json
└─ README.md
```

---

## 3. 開発ステップ

### Step 1: プロジェクト作成
- Next.js（App Router）作成
- Tailwind CSS 導入
- Prisma 導入 / SQLite 接続
- `.gitignore` に `data/`・`.env.local` を追加
- **HUDテーマ基盤の構築**（[UIデザインシステム](./09_ui-design-system.md)）:
  - `globals.css` にカラーCSS変数・グリッド背景・グロー/明滅アニメーションを定義
  - Tailwind に `accent`/`warn`/`danger` 等のカラー拡張、角丸無効（`rounded-none` 基本）
  - 共通HUDコンポーネント（`GridBackground` / `HudPanel` / `StatusBadge` / `HexIcon` / `CommandBar` / `NeonButton`）の雛形作成
  - 共通レイアウトにコマンドバー＋サイドナビ（コントロールルーム風）を適用

成果物: 起動可能な空アプリ＋コントロールルーム風HUDテーマの土台

### Step 2: DB作成
- `prisma/schema.prisma` 作成（[DB設計書](./04_db-design.md#4-prismaスキーマ)）
- migration 実行
- 初期モデルデータ投入（seed）

成果物: DB・テーブル・初期データ

### Step 3: 評価テーマ管理
- API: `cases` 一式（GET/POST/GET:id/PUT/DELETE）
- 画面: 一覧 `/cases` / 登録 `/cases/new` / 詳細・編集 `/cases/[id]`
- コンポーネント: `CaseForm.tsx`

成果物: テーマのCRUD

### Step 4: モデル管理
- API: `models` 一式
- 画面: `/models`、有効/無効トグル
- コンポーネント: `ModelForm.tsx`

成果物: モデルのCRUD

### Step 5: LLM実行処理（共通IF）
- `lib/llm/index.ts` で共通インターフェース定義
- `openai.ts` / `anthropic.ts` / `gemini.ts` 実装
- OpenAI互換は `openai.ts` + `apiBaseUrl` で対応
- `lib/cost.ts` コスト計算

成果物: 単一モデルへの送信・トークン/コスト取得

### Step 6: 一括実行
- API: `POST /api/runs`
- `p-limit(3)` + `Promise.allSettled` + `AbortController`
- 結果を `benchmark_run_results` に保存（成功/失敗）

成果物: 複数モデル並列実行・回答保存

### Step 7: Judge採点
- `lib/judge.ts`: Judgeプロンプト生成・呼び出し・JSONパース
- パース失敗時 `raw_judge_response` 保存
- `benchmark_scores` に保存

成果物: 採点結果の保存

### Step 8: 結果表示
- 画面: 実行履歴 `/runs`（テーマ詳細付きカード一覧）/ 実行詳細 `/runs/[id]`
- 実行詳細: 評価テーマ・採点基準・スコア表（`ScoreChart.tsx`）・採点根拠（項目別＋Judgeコメント）・回答全文（`ResponseAccordion.tsx`）
- ダッシュボード `/dashboard`（モデル別スコア・カテゴリ別ランキング）

成果物: スコア比較・採点根拠の明示・回答比較・可視化

### Step 9: CSV出力
- `lib/csv.ts`
- API: `GET /api/runs/:id/export`
- 実行詳細画面にダウンロードボタン

成果物: CSVダウンロード

### Step 10: 設定・仕上げ
- 画面: `/settings`（APIキー状態表示・Judge既定・同時実行数）
- APIキー未設定時の警告バナー
- エラーハンドリング・空状態・ローディングの整備

成果物: MVP完成

---

## 4. マイルストーン

| MS | 内容 | 含むStep |
| -- | ---- | -------- |
| M1 | 基盤構築 | Step 1–2 |
| M2 | マスタ管理 | Step 3–4 |
| M3 | 実行エンジン | Step 5–7 |
| M4 | 可視化・出力 | Step 8–9 |
| M5 | 仕上げ・MVP完成 | Step 10 |

---

## 5. 依存パッケージ（想定）

| パッケージ | 用途 |
| ---------- | ---- |
| next / react / react-dom | フレームワーク |
| tailwindcss | スタイル |
| recharts | グラフ |
| prisma / @prisma/client | ORM |
| openai | OpenAI / OpenAI互換 |
| @anthropic-ai/sdk | Anthropic |
| @google/generative-ai | Gemini |
| p-limit | 同時実行制御 |

> Claude（Anthropic）を扱う実装に着手する際は、最新のモデルID・SDK仕様を `claude-api` スキルで確認すること。

---

## 6. 完了の定義（MVP DoD）

- [ ] 評価テーマを登録・編集・削除できる
- [ ] モデルを登録・有効/無効切り替えできる
- [ ] 複数モデルへ一括実行し回答・時間・トークン・コストが保存される
- [ ] Judge採点が保存・表示される
- [ ] 実行詳細でモデル間比較ができる
- [ ] CSV出力ができる
- [ ] APIキー未設定時に警告が出る
- [ ] APIキーがDB保存・Git管理・画面平文表示・ログ出力されていない

---

## 7. 将来拡張のバックログ

[要件定義書 §6.2](./01_requirements.md#62-後回し機能将来拡張) を参照。複数回実行 → Judge複数化 → ELOレーティング → 実案件テンプレート の順を想定。
