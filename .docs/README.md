# ローカル実行型 LLM ベンチマークアプリ — 設計ドキュメント

複数のLLMモデルへ同一の評価テーマを実行し、回答品質・実行時間・コストを定量比較する**ローカル完結型**アプリの設計ドキュメント群です。

---

## ドキュメント一覧

| No. | ドキュメント | 概要 |
| --- | ------------ | ---- |
| 01 | [要件定義書](./01_requirements.md) | 目的・前提・機能要件・非機能要件・MVPスコープ |
| 02 | [設計書](./02_design.md) | システム全体構成・技術構成・処理フロー・実行制御 |
| 03 | [画面設計書](./03_screen-design.md) | 画面一覧・画面遷移・各画面のレイアウト・UI仕様 |
| 04 | [DB設計書](./04_db-design.md) | ER図・テーブル定義・Prismaスキーマ・初期データ |
| 05 | [API設計書](./05_api-design.md) | エンドポイント仕様・リクエスト/レスポンス・エラー設計 |
| 06 | [実装計画書](./06_implementation-plan.md) | 開発ステップ・タスク分解・マイルストーン・ディレクトリ構成 |
| 07 | [セキュリティ設計書](./07_security-design.md) | APIキー管理・ローカルデータ保護・機密情報マスキング |
| 08 | [テスト計画書](./08_test-plan.md) | テスト方針・テスト観点・テストケース・受け入れ基準 |
| 09 | [UIデザインシステム](./09_ui-design-system.md) | コントロールルーム風HUDテーマ・カラー・形状・ステータス表示・コンポーネント |

---

## プロダクト概要

- **目的**: モデル選定を「感覚」や「評判」ではなく、自社業務に近い評価テーマによる定量比較で行えるようにする。
- **動作環境**: 個人PC上で完結。クラウドにサーバー・DB・ストレージは構築しない。
- **外部依存**: LLM推論のみ外部API（OpenAI / Anthropic / Gemini / OpenAI互換）を利用。
- **保存先**: 評価テーマ・回答・採点結果はすべてローカルSQLite DBに保存。

## 技術スタック（サマリ）

| レイヤ | 技術 |
| ------ | ---- |
| フロントエンド | Next.js (App Router) / React / Tailwind CSS / Recharts ※[コントロールルーム風HUD UI](./09_ui-design-system.md) |
| バックエンド | Next.js API Routes / Node.js / TypeScript |
| DB | SQLite / Prisma ORM |
| LLM連携 | OpenAI SDK / Anthropic SDK / Google Generative AI SDK / OpenAI互換共通クライアント |
| 実行制御 | Promise.allSettled / p-limit / AbortController |

詳細は [設計書](./02_design.md) を参照してください。

---

最終更新: 2026-06-09
