import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * シードデータ。
 *
 * - LLMモデル: 直近約1年（2025-06〜2026-06想定）にリリースされた主要モデル。
 *   Claudeの価格は claude-api 公式リファレンス（per 1M）を per 1K に換算した正確な値。
 *   OpenAI / Google の価格は 2026-01 時点の知識に基づく概算のため、運用時に
 *   設定画面（モデル管理）で最新値へ更新すること。
 * - 評価テーマ: 全カテゴリを網羅した15テーマ。
 *
 * 注意: このシードは benchmark_models / benchmark_cases（および関連する runs/results/
 * scores）を一旦すべて削除してから再投入する（クリーンリセット）。
 */

// 単価は USD / 1Kトークン。
const MODELS = [
  // ===== Anthropic（claude-api 公式価格 per 1M → per 1K に換算・正確） =====
  {
    provider: "Anthropic",
    modelName: "claude-opus-4-8",
    displayName: "Claude Opus 4.8",
    inputCostPer1k: 0.005, // $5 / 1M
    outputCostPer1k: 0.025, // $25 / 1M
  },
  {
    provider: "Anthropic",
    modelName: "claude-opus-4-7",
    displayName: "Claude Opus 4.7",
    inputCostPer1k: 0.005,
    outputCostPer1k: 0.025,
  },
  {
    provider: "Anthropic",
    modelName: "claude-opus-4-6",
    displayName: "Claude Opus 4.6",
    inputCostPer1k: 0.005,
    outputCostPer1k: 0.025,
  },
  {
    provider: "Anthropic",
    modelName: "claude-sonnet-4-6",
    displayName: "Claude Sonnet 4.6",
    inputCostPer1k: 0.003, // $3 / 1M
    outputCostPer1k: 0.015, // $15 / 1M
  },
  {
    provider: "Anthropic",
    modelName: "claude-haiku-4-5",
    displayName: "Claude Haiku 4.5",
    inputCostPer1k: 0.001, // $1 / 1M
    outputCostPer1k: 0.005, // $5 / 1M
  },

  // ===== OpenAI（価格は概算・要確認） =====
  {
    provider: "OpenAI",
    modelName: "gpt-5.1",
    displayName: "GPT-5.1",
    inputCostPer1k: 0.00125,
    outputCostPer1k: 0.01,
  },
  {
    provider: "OpenAI",
    modelName: "gpt-5",
    displayName: "GPT-5",
    inputCostPer1k: 0.00125,
    outputCostPer1k: 0.01,
  },
  {
    provider: "OpenAI",
    modelName: "gpt-5-mini",
    displayName: "GPT-5 mini",
    inputCostPer1k: 0.00025,
    outputCostPer1k: 0.002,
  },
  {
    provider: "OpenAI",
    modelName: "o3",
    displayName: "OpenAI o3",
    inputCostPer1k: 0.002,
    outputCostPer1k: 0.008,
  },
  {
    provider: "OpenAI",
    modelName: "o4-mini",
    displayName: "OpenAI o4-mini",
    inputCostPer1k: 0.0011,
    outputCostPer1k: 0.0044,
  },
  {
    provider: "OpenAI",
    modelName: "gpt-4.1",
    displayName: "GPT-4.1",
    inputCostPer1k: 0.002,
    outputCostPer1k: 0.008,
  },

  // ===== Google（価格は概算・要確認） =====
  {
    provider: "Google",
    modelName: "gemini-2.5-pro",
    displayName: "Gemini 2.5 Pro",
    inputCostPer1k: 0.00125,
    outputCostPer1k: 0.01,
  },
  {
    provider: "Google",
    modelName: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    inputCostPer1k: 0.0003,
    outputCostPer1k: 0.0025,
  },
  {
    provider: "Google",
    modelName: "gemini-2.5-flash-lite",
    displayName: "Gemini 2.5 Flash-Lite",
    inputCostPer1k: 0.0001,
    outputCostPer1k: 0.0004,
  },
];

const CASES = [
  // ===== 開発 =====
  {
    title: "REST API設計（ECサイト）",
    category: "設計",
    prompt:
      "ECサイトの商品・注文・在庫を扱うREST APIを設計してください。主要エンドポイント、HTTPメソッド、リクエスト/レスポンスのJSON例、ステータスコード設計、認証方式、考慮すべき非機能要件（ページング・冪等性・レート制限）を含めてください。",
    expectedOutput: "エンドポイント一覧、JSONスキーマ例、設計方針のドキュメント",
    memo: "API設計の網羅性と実用性を評価",
  },
  {
    title: "Next.js（App Router）での認証実装",
    category: "開発",
    prompt:
      "Next.js 14 App Router でメール+パスワード認証とセッション管理を実装してください。サーバーアクション、Cookieベースのセッション、ミドルウェアによる保護ルート、CSRF対策を含め、主要なコード例を示してください。",
    expectedOutput: "認証フローの実装コードと構成説明",
    memo: "最新フレームワーク知識と実装力を評価",
  },
  {
    title: "遅いSQLクエリの最適化",
    category: "開発",
    prompt:
      "1000万行の注文テーブルに対する集計クエリが遅い。実行計画の読み方、インデックス設計、クエリ書き換え、パーティショニング、マテリアライズドビューの観点から最適化手順を具体的に説明してください。対象はPostgreSQLとします。",
    expectedOutput: "ボトルネック分析と段階的な最適化手順",
    memo: "DBパフォーマンスチューニングの実用性を評価",
  },
  {
    title: "型安全なフォームバリデーション実装",
    category: "開発",
    prompt:
      "TypeScript + React で、ネストしたオブジェクトと配列を含む複雑なフォームの型安全なバリデーションを実装してください。スキーマ定義、エラー表示、非同期バリデーション（サーバー重複チェック）を含めてください。",
    expectedOutput: "型安全な実装コードと設計意図",
    memo: "型システム活用と実装品質を評価",
  },

  // ===== 調査 =====
  {
    title: "メッセージキュー技術の選定調査",
    category: "調査",
    prompt:
      "マイクロサービス間の非同期通信に使うメッセージング基盤として Kafka / RabbitMQ / Amazon SQS を比較してください。スループット、順序保証、配信保証、運用コスト、学習コスト、適するユースケースを表で整理し、想定要件（日次1億メッセージ、順序保証必要）に対する推奨を示してください。",
    expectedOutput: "比較表と要件に基づく推奨",
    memo: "技術比較の網羅性と根拠の明確さを評価",
  },
  {
    title: "状態管理ライブラリの比較",
    category: "調査",
    prompt:
      "React の状態管理ライブラリ Redux Toolkit / Zustand / Jotai / TanStack Query を比較してください。設計思想、ボイラープレート量、サーバー状態の扱い、学習コスト、バンドルサイズの観点で整理し、中規模SaaS開発における選定指針を示してください。",
    expectedOutput: "比較表と選定指針",
    memo: "最新エコシステム知識を評価",
  },
  {
    title: "ベクトルDBの調査",
    category: "調査",
    prompt:
      "RAGアプリ向けのベクトルデータベースとして pgvector / Pinecone / Qdrant / Weaviate を調査してください。検索精度、スケール特性、ハイブリッド検索対応、運用形態（マネージド/セルフホスト）、コストを比較し、社内ナレッジ検索（文書10万件）への推奨を示してください。",
    expectedOutput: "比較表と推奨構成",
    memo: "新しい技術領域の調査力を評価",
  },

  // ===== 設計 =====
  {
    title: "モノリスからマイクロサービスへの分割設計",
    category: "設計",
    prompt:
      "ECサイトのモノリシックアプリをマイクロサービスへ移行する設計を提案してください。サービス境界の決め方（DDD）、データ分割、サービス間通信、分散トランザクション（Saga）、移行のステップ（ストラングラーパターン）を含めてください。",
    expectedOutput: "サービス分割案と移行ロードマップ",
    memo: "アーキテクチャ設計力と段階的移行の実用性を評価",
  },
  {
    title: "マルチテナントSaaSのDB設計",
    category: "設計",
    prompt:
      "マルチテナントSaaSのデータベース設計を提案してください。テナント分離方式（DB分離/スキーマ分離/行レベル分離）のトレードオフ、選定基準、行レベル分離を採用する場合のスキーマ設計とRLSポリシー、テナント間データ漏洩の防止策を説明してください。",
    expectedOutput: "テナント分離方式の比較と推奨スキーマ",
    memo: "設計トレードオフの理解度を評価",
  },
  {
    title: "リアルタイム通知システムの設計",
    category: "設計",
    prompt:
      "数十万同時接続を想定したリアルタイム通知システムを設計してください。WebSocket/SSEの選択、接続管理、水平スケール（Pub/Sub）、メッセージの到達保証、オフラインユーザーへの配信、障害時のフォールバックを含めてください。",
    expectedOutput: "システム構成図と設計判断の根拠",
    memo: "スケーラビリティ設計を評価",
  },

  // ===== 障害解析 =====
  {
    title: "本番APIのレイテンシ急増の原因分析",
    category: "障害解析",
    prompt:
      "本番のAPIレスポンスが平常時50msから突然2000msに悪化した。CPU・メモリは正常、DBコネクションプールが枯渇気味。考えられる原因の切り分け手順、確認すべきメトリクス/ログ、再発防止策を体系的に説明してください。",
    expectedOutput: "原因切り分けの手順と再発防止策",
    memo: "障害対応の論理性と網羅性を評価",
  },
  {
    title: "Node.jsアプリのメモリリーク調査",
    category: "障害解析",
    prompt:
      "Node.jsアプリのメモリ使用量が時間とともに増加し、数時間でOOMで落ちる。原因を特定するための調査手順（ヒープスナップショット取得・比較、よくあるリーク原因）と、特定後の修正方針を具体的に説明してください。",
    expectedOutput: "調査手順と典型的なリーク原因の分析",
    memo: "デバッグ手法の実用性を評価",
  },
  {
    title: "断続的に発生するデッドロックの解析",
    category: "障害解析",
    prompt:
      "本番DBで断続的にデッドロックが発生し、一部トランザクションが失敗する。デッドロックの発生メカニズム、ログからの原因特定方法、ロック順序の統一・分離レベル調整・リトライ設計などの対策を、優先順位をつけて説明してください。",
    expectedOutput: "デッドロックの原因分析と対策の優先順位",
    memo: "間欠障害への分析力を評価",
  },

  // ===== ドキュメント作成 =====
  {
    title: "新規メンバー向けオンボーディング手順書",
    category: "ドキュメント作成",
    prompt:
      "Webアプリ開発チームに参加した新規エンジニア向けのオンボーディング手順書を作成してください。開発環境構築、リポジトリ構成、ブランチ運用、ローカル起動、テスト実行、デプロイフロー、困ったときの連絡先を、初心者にも分かる順序と粒度でまとめてください。",
    expectedOutput: "段階的なオンボーディング手順書",
    memo: "ドキュメントの分かりやすさと網羅性を評価",
  },
  {
    title: "障害対応ランブックの作成",
    category: "ドキュメント作成",
    prompt:
      "本番障害発生時の対応ランブックを作成してください。検知（アラート種別）、初動（影響範囲確認・エスカレーション）、一次対応、恒久対応、ポストモーテムの各フェーズで、誰が何をするかを明確にし、テンプレート化してください。",
    expectedOutput: "フェーズ別の障害対応ランブック",
    memo: "運用ドキュメントの実用性を評価",
  },
];

async function main() {
  console.log("[seed] resetting benchmark data...");
  // FK整合性を保つ順序で全削除（クリーンリセット）
  await prisma.benchmarkScore.deleteMany();
  await prisma.benchmarkRunResult.deleteMany();
  await prisma.benchmarkRun.deleteMany();
  await prisma.benchmarkCase.deleteMany();
  await prisma.benchmarkModel.deleteMany();

  console.log(`[seed] inserting ${MODELS.length} models...`);
  for (const m of MODELS) {
    await prisma.benchmarkModel.create({
      data: {
        provider: m.provider,
        modelName: m.modelName,
        displayName: m.displayName,
        apiBaseUrl: null,
        inputCostPer1k: m.inputCostPer1k,
        outputCostPer1k: m.outputCostPer1k,
        enabled: true,
      },
    });
  }

  console.log(`[seed] inserting ${CASES.length} cases...`);
  for (const c of CASES) {
    await prisma.benchmarkCase.create({
      data: {
        title: c.title,
        category: c.category,
        prompt: c.prompt,
        expectedOutput: c.expectedOutput ?? null,
        memo: c.memo ?? null,
      },
    });
  }

  console.log("[seed] done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
