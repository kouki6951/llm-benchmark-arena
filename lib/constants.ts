/** 評価テーマのカテゴリ候補 */
export const CASE_CATEGORIES = [
  "開発",
  "調査",
  "設計",
  "障害解析",
  "ドキュメント作成",
  "コードレビュー",
  "セキュリティ調査",
] as const;

/** モデルのプロバイダー候補 */
export const PROVIDERS = [
  "OpenAI",
  "Anthropic",
  "Google",
  "OpenAI互換",
] as const;

/** 実行ステータス */
export type RunStatus = "running" | "done" | "error";

/** 結果ステータス */
export type ResultStatus = "success" | "error";
