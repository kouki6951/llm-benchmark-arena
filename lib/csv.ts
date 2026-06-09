/** CSVセルのエスケープ（カンマ・改行・ダブルクォート対応） */
function escapeCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export interface CsvRunRow {
  caseTitle: string;
  modelName: string;
  response: string | null;
  totalScore: number | null;
  accuracy: number | null;
  coverage: number | null;
  practicality: number | null;
  readability: number | null;
  evidence: number | null;
  latencyMs: number | null;
  estimatedCost: number | null;
  judgeComment: string | null;
}

const HEADER = [
  "評価テーマ",
  "モデル名",
  "回答",
  "総合点",
  "正確性",
  "網羅性",
  "実用性",
  "可読性",
  "根拠の明確さ",
  "実行時間(ms)",
  "推定コスト",
  "Judgeコメント",
];

/** 実行結果をCSV文字列に変換する（先頭にBOMを付与しExcelで文字化けを防ぐ） */
export function buildRunCsv(rows: CsvRunRow[]): string {
  const lines = [HEADER.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.caseTitle,
        r.modelName,
        r.response,
        r.totalScore,
        r.accuracy,
        r.coverage,
        r.practicality,
        r.readability,
        r.evidence,
        r.latencyMs,
        r.estimatedCost,
        r.judgeComment,
      ]
        .map(escapeCell)
        .join(","),
    );
  }
  return "﻿" + lines.join("\r\n");
}
