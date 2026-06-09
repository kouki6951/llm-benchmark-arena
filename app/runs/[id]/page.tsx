import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/hud/PageHeader";
import { HudPanel } from "@/components/hud/HudPanel";
import { NeonButton } from "@/components/hud/NeonButton";
import { StatusBadge, runStatusToHud } from "@/components/hud/StatusBadge";
import { ScoreChart } from "@/components/ScoreChart";
import { ResponseAccordion } from "@/components/ResponseAccordion";
import { formatCostUsd } from "@/lib/cost";

export const dynamic = "force-dynamic";

// 評価基準（100点満点の配点と観点）
const CRITERIA = [
  { key: "accuracy", label: "正確性", max: 40, desc: "事実・技術的な正しさ。誤りがないか" },
  { key: "coverage", label: "網羅性", max: 20, desc: "要求事項をどれだけカバーしているか" },
  { key: "practicality", label: "実用性", max: 20, desc: "実務でそのまま使える具体性・有用性" },
  { key: "readability", label: "可読性", max: 10, desc: "構成・説明の分かりやすさ" },
  { key: "evidence", label: "根拠の明確さ", max: 10, desc: "主張の裏付け・出典の明示" },
] as const;

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await prisma.benchmarkRun.findUnique({
    where: { id: Number(id) },
    include: {
      case: true,
      results: { include: { model: true, scores: true }, orderBy: { id: "asc" } },
    },
  });
  if (!run) notFound();

  const items = run.results.map((r) => {
    const s = r.scores[0] ?? null;
    return {
      id: r.id,
      modelDisplayName: r.model.displayName,
      provider: r.model.provider,
      response: r.response,
      latencyMs: r.latencyMs,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      estimatedCost: r.estimatedCost,
      status: r.status,
      errorMessage: r.errorMessage,
      score: s
        ? {
            accuracy: s.accuracy,
            coverage: s.coverage,
            practicality: s.practicality,
            readability: s.readability,
            evidence: s.evidence,
            totalScore: s.totalScore,
            judgeComment: s.judgeComment,
            rawJudgeResponse: s.rawJudgeResponse,
          }
        : null,
    };
  });

  const errorCount = items.filter((i) => i.status === "error").length;
  const chartData = items
    .filter((i) => i.status === "success" && i.score?.totalScore != null)
    .map((i) => ({ name: i.modelDisplayName, total: i.score!.totalScore! }))
    .sort((a, b) => b.total - a.total);

  const judgeInfo = run.results[0]?.scores[0];

  return (
    <div className="max-w-5xl">
      <PageHeader code={`RUN #${run.id} // 採点結果`} title={run.title}>
        <a href={`/api/runs/${run.id}/export`}>
          <NeonButton variant="ghost">⬇ CSV EXPORT</NeonButton>
        </a>
      </PageHeader>

      {/* サマリ */}
      <HudPanel
        title="RUN SUMMARY"
        meta={
          <Link href={`/cases/${run.caseId}`} className="text-accent">
            CASE #{run.caseId}
          </Link>
        }
        className="mb-5"
      >
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <StatusBadge status={runStatusToHud(run.status, errorCount > 0)} />
          <span className="font-mono text-xs text-text-muted">
            CATEGORY: <span className="text-accent">{run.case.category}</span>
          </span>
          {judgeInfo && (
            <span className="font-mono text-xs text-text-muted">
              JUDGE: <span className="text-info">{judgeInfo.judgeModel}</span>
            </span>
          )}
          <span className="font-mono text-xs text-text-muted">
            MODELS: {items.length}
            {errorCount > 0 && (
              <span className="text-danger"> ({errorCount} FAILED)</span>
            )}
          </span>
        </div>
      </HudPanel>

      {/* 評価テーマ */}
      <HudPanel title="EVALUATION TASK // 評価テーマ" className="mb-5">
        <div className="flex flex-col gap-4 text-sm">
          <div>
            <div className="hud-label mb-1 text-[11px] text-text-muted">
              プロンプト（各モデルへ送信した内容）
            </div>
            <pre className="whitespace-pre-wrap border-l-2 border-accent/40 pl-3 font-mono text-text-primary">
              {run.case.prompt}
            </pre>
          </div>
          {run.case.expectedOutput && (
            <div>
              <div className="hud-label mb-1 text-[11px] text-text-muted">
                想定する成果物
              </div>
              <p className="border-l-2 border-border pl-3 text-text-primary">
                {run.case.expectedOutput}
              </p>
            </div>
          )}
          {run.case.rubricJson && (
            <div>
              <div className="hud-label mb-1 text-[11px] text-text-muted">
                評価観点 / Rubric
              </div>
              <pre className="whitespace-pre-wrap border-l-2 border-border pl-3 font-mono text-text-muted">
                {run.case.rubricJson}
              </pre>
            </div>
          )}
        </div>
      </HudPanel>

      {/* 採点基準 */}
      <HudPanel title="SCORING RUBRIC // 採点基準（100点満点）" className="mb-5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {CRITERIA.map((c) => (
            <div
              key={c.key}
              className="clip-hud-sm border border-border bg-base p-3"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-text-primary">{c.label}</span>
                <span className="hud-label text-accent glow">/{c.max}</span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-text-muted">
                {c.desc}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-text-muted">
          各モデルの回答を Judge LLM（
          <span className="text-info">{judgeInfo?.judgeModel ?? "-"}</span>
          ）が上記基準で採点。総合点は5項目の合計（100点満点）です。
        </p>
      </HudPanel>

      {/* スコア比較表 + チャート */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <HudPanel title="SCORE MATRIX">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {[
                    "モデル",
                    "総合/100",
                    "正確/40",
                    "網羅/20",
                    "実用/20",
                    "可読/10",
                    "根拠/10",
                    "時間",
                    "コスト",
                  ].map((h) => (
                    <th
                      key={h}
                      className="hud-label whitespace-nowrap py-2 pr-2 text-[10px] text-text-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((i) => {
                  const top =
                    chartData.length > 0 &&
                    i.score?.totalScore === chartData[0].total &&
                    i.status === "success";
                  return (
                    <tr
                      key={i.id}
                      className={`border-b border-border/50 font-mono text-xs ${
                        top ? "bg-accent/5" : ""
                      }`}
                    >
                      <td className="py-2 pr-2 font-sans text-text-primary">
                        {top && <span className="text-accent">▲ </span>}
                        {i.modelDisplayName}
                      </td>
                      {i.status === "error" ? (
                        <td colSpan={8} className="py-2 text-danger">
                          ERROR
                        </td>
                      ) : (
                        <>
                          <td className="py-2 pr-2 text-accent glow">
                            {i.score?.totalScore ?? "-"}
                          </td>
                          <td className="py-2 pr-2 text-text-muted">
                            {i.score?.accuracy ?? "-"}
                          </td>
                          <td className="py-2 pr-2 text-text-muted">
                            {i.score?.coverage ?? "-"}
                          </td>
                          <td className="py-2 pr-2 text-text-muted">
                            {i.score?.practicality ?? "-"}
                          </td>
                          <td className="py-2 pr-2 text-text-muted">
                            {i.score?.readability ?? "-"}
                          </td>
                          <td className="py-2 pr-2 text-text-muted">
                            {i.score?.evidence ?? "-"}
                          </td>
                          <td className="py-2 pr-2 text-text-muted">
                            {i.latencyMs ?? "-"}ms
                          </td>
                          <td className="py-2 pr-2 text-text-muted">
                            {formatCostUsd(i.estimatedCost)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </HudPanel>

        <HudPanel title="SCORE CHART">
          <ScoreChart data={chartData} />
        </HudPanel>
      </div>

      {/* 採点根拠（項目別内訳 + Judgeコメント） */}
      <div className="mb-2">
        <span className="hud-label text-xs text-accent glow">
          JUDGE RATIONALE // 採点根拠
        </span>
      </div>
      <div className="mb-5 flex flex-col gap-3">
        {items.map((i) => {
          if (i.status === "error") {
            return (
              <div
                key={i.id}
                className="clip-hud-sm border border-danger bg-danger/10 px-4 py-3"
              >
                <span className="text-text-primary">{i.modelDisplayName}</span>
                <span className="hud-label ml-3 text-xs text-danger">
                  ERROR // {i.errorMessage}
                </span>
              </div>
            );
          }
          return (
            <HudPanel
              key={i.id}
              title={i.modelDisplayName}
              meta={
                <span className="text-accent glow">
                  {i.score?.totalScore ?? "-"} / 100
                </span>
              }
            >
              {/* 項目別内訳バー */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {CRITERIA.map((c) => {
                  const val = (i.score?.[c.key] as number | null) ?? null;
                  const pct = val != null ? (val / c.max) * 100 : 0;
                  return (
                    <div key={c.key}>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] text-text-muted">
                          {c.label}
                        </span>
                        <span className="font-mono text-xs text-text-primary">
                          {val ?? "-"}
                          <span className="text-text-muted">/{c.max}</span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full bg-base">
                        <div
                          className="h-1.5 bg-accent"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Judgeコメント（採点理由） */}
              <div className="mt-4">
                <div className="hud-label mb-1 text-[11px] text-accent">
                  JUDGE COMMENT // 採点理由
                </div>
                {i.score?.judgeComment ? (
                  <p className="border-l-2 border-accent/40 pl-3 text-sm text-text-primary">
                    {i.score.judgeComment}
                  </p>
                ) : i.score?.rawJudgeResponse ? (
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap border-l-2 border-warn/40 pl-3 font-mono text-xs text-text-muted">
                    {i.score.rawJudgeResponse}
                  </pre>
                ) : (
                  <p className="text-xs text-text-muted">（コメントなし）</p>
                )}
              </div>

              {/* 回答全文（アコーディオン） */}
              <ResponseAccordion
                response={i.response}
                latencyMs={i.latencyMs}
                inputTokens={i.inputTokens}
                outputTokens={i.outputTokens}
                estimatedCost={i.estimatedCost}
              />
            </HudPanel>
          );
        })}
      </div>
    </div>
  );
}
