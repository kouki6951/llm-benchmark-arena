import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/hud/PageHeader";
import { HudPanel } from "@/components/hud/HudPanel";
import { HexIcon } from "@/components/hud/HexIcon";
import { ScoreChart } from "@/components/ScoreChart";
import { StatusBadge } from "@/components/hud/StatusBadge";
import { formatCostUsd } from "@/lib/cost";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 成功した結果＋スコア＋モデル＋カテゴリを集計用に取得
  const results = await prisma.benchmarkRunResult.findMany({
    where: { status: "success" },
    include: {
      model: true,
      scores: true,
      run: { include: { case: { select: { category: true } } } },
    },
  });

  // ===== モデル別集計 =====
  type Agg = {
    name: string;
    totalSum: number;
    totalCount: number;
    latencySum: number;
    latencyCount: number;
    costSum: number;
  };
  const byModel = new Map<number, Agg>();
  // ===== カテゴリ別集計 (category -> model -> {sum,count}) =====
  const byCategory = new Map<string, Map<string, { sum: number; count: number }>>();

  for (const r of results) {
    const score = r.scores[0];
    const total = score?.totalScore ?? null;

    const a =
      byModel.get(r.modelId) ??
      {
        name: r.model.displayName,
        totalSum: 0,
        totalCount: 0,
        latencySum: 0,
        latencyCount: 0,
        costSum: 0,
      };
    if (total != null) {
      a.totalSum += total;
      a.totalCount += 1;
    }
    if (r.latencyMs != null) {
      a.latencySum += r.latencyMs;
      a.latencyCount += 1;
    }
    a.costSum += r.estimatedCost ?? 0;
    byModel.set(r.modelId, a);

    if (total != null) {
      const cat = r.run.case.category;
      const m = byCategory.get(cat) ?? new Map();
      const e = m.get(r.model.displayName) ?? { sum: 0, count: 0 };
      e.sum += total;
      e.count += 1;
      m.set(r.model.displayName, e);
      byCategory.set(cat, m);
    }
  }

  const modelRows = Array.from(byModel.values())
    .map((a) => ({
      name: a.name,
      avgTotal: a.totalCount ? Math.round(a.totalSum / a.totalCount) : null,
      avgLatency: a.latencyCount
        ? Math.round(a.latencySum / a.latencyCount)
        : null,
      totalCost: a.costSum,
    }))
    .sort((x, y) => (y.avgTotal ?? -1) - (x.avgTotal ?? -1));

  const chartData = modelRows
    .filter((m) => m.avgTotal != null)
    .map((m) => ({ name: m.name, total: m.avgTotal! }));

  const categoryRanking = Array.from(byCategory.entries()).map(
    ([category, m]) => {
      let best = "-";
      let bestAvg = -1;
      for (const [name, e] of m.entries()) {
        const avg = e.sum / e.count;
        if (avg > bestAvg) {
          bestAvg = avg;
          best = name;
        }
      }
      return { category, best, avg: Math.round(bestAvg) };
    },
  );

  const runCount = await prisma.benchmarkRun.count();

  return (
    <div>
      <PageHeader code="DASHBOARD // 集計結果" title="ダッシュボード">
        <StatusBadge status="online" />
      </PageHeader>

      {modelRows.length === 0 ? (
        <HudPanel>
          <div className="flex flex-col items-center gap-3 py-12">
            <HexIcon size="h-14 w-14" className="text-text-muted">
              ∅
            </HexIcon>
            <span className="hud-label text-sm text-text-muted">
              NO DATA
            </span>
            <span className="text-sm text-text-muted">
              採点済みの実行がありません。評価テーマからベンチマークを実行してください。
            </span>
            <Link
              href="/cases"
              className="hud-label text-xs text-accent hover:glow"
            >
              GO TO CASES →
            </Link>
          </div>
        </HudPanel>
      ) : (
        <div className="flex flex-col gap-5">
          {/* KPIストリップ */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="RUNS" value={String(runCount)} />
            <Kpi label="MODELS" value={String(modelRows.length)} />
            <Kpi
              label="TOP MODEL"
              value={modelRows[0]?.name ?? "-"}
              accent
            />
            <Kpi
              label="TOP SCORE"
              value={
                modelRows[0]?.avgTotal != null
                  ? `${modelRows[0].avgTotal}/100`
                  : "-"
              }
              accent
            />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* モデル別スコア */}
            <HudPanel title="SCOREBOARD // モデル別スコア">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {["モデル", "平均総合", "平均時間", "累計コスト"].map((h, i) => (
                      <th
                        key={h}
                        className={`hud-label py-2 text-[11px] text-text-muted ${
                          i > 0 ? "text-right" : ""
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modelRows.map((m, i) => (
                    <tr
                      key={m.name}
                      className={`border-b border-border/50 ${
                        i === 0 ? "bg-accent/5" : ""
                      }`}
                    >
                      <td className="py-2 text-text-primary">
                        {i === 0 && <span className="text-accent">▲ </span>}
                        {m.name}
                      </td>
                      <td className="py-2 text-right font-mono text-accent glow">
                        {m.avgTotal ?? "-"}
                      </td>
                      <td className="py-2 text-right font-mono text-xs text-text-muted">
                        {m.avgLatency != null
                          ? `${(m.avgLatency / 1000).toFixed(1)}s`
                          : "-"}
                      </td>
                      <td className="py-2 text-right font-mono text-xs text-text-muted">
                        {formatCostUsd(m.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </HudPanel>

            {/* スコアチャート */}
            <HudPanel title="SCORE DISTRIBUTION">
              <ScoreChart data={chartData} />
            </HudPanel>
          </div>

          {/* カテゴリ別ランキング */}
          <HudPanel title="CATEGORY RANKING // カテゴリ別ランキング">
            {categoryRanking.length === 0 ? (
              <span className="hud-label text-xs text-text-muted">NO DATA</span>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {categoryRanking.map((c) => (
                  <div
                    key={c.category}
                    className="clip-hud-sm border border-border bg-base p-3"
                  >
                    <div className="hud-label text-[10px] text-text-muted">
                      {c.category}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm text-accent">{c.best}</span>
                      <span className="font-mono text-xs text-text-muted">
                        {c.avg}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </HudPanel>
        </div>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="clip-hud border border-border bg-panel p-4">
      <div className="hud-label text-[10px] text-text-muted">{label}</div>
      <div
        className={`mt-1 truncate text-lg font-semibold ${
          accent ? "text-accent glow" : "text-text-primary"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
