import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/hud/PageHeader";
import { HudPanel } from "@/components/hud/HudPanel";
import { HexIcon } from "@/components/hud/HexIcon";
import { StatusBadge, runStatusToHud } from "@/components/hud/StatusBadge";

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const runs = await prisma.benchmarkRun.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      results: { select: { status: true } },
      case: { select: { id: true, category: true, prompt: true } },
    },
  });

  return (
    <div className="max-w-5xl">
      <PageHeader code="RUNS // 実行履歴" title="実行履歴" />

      {runs.length === 0 ? (
        <HudPanel>
          <div className="flex flex-col items-center gap-3 py-12">
            <HexIcon size="h-14 w-14" className="text-text-muted">
              ∅
            </HexIcon>
            <span className="hud-label text-sm text-text-muted">NO RUNS</span>
            <span className="text-sm text-text-muted">
              実行履歴がありません。評価テーマからベンチマークを実行してください。
            </span>
          </div>
        </HudPanel>
      ) : (
        <HudPanel title="RUN LOG" meta={`COUNT: ${runs.length}`}>
          <div className="flex flex-col gap-3">
            {runs.map((r) => {
              const errorCount = r.results.filter(
                (x) => x.status === "error",
              ).length;
              return (
                <Link
                  key={r.id}
                  href={`/runs/${r.id}`}
                  className="group block border border-border bg-base p-4 transition-all hover:border-accent/50 hover:bg-panel-alt"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* 左: テーマ詳細 */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="hud-label text-[11px] text-text-muted">
                          RUN-{String(r.id).padStart(4, "0")}
                        </span>
                        <span className="clip-hud-sm border border-accent/40 px-2 py-0.5 text-[11px] text-accent">
                          {r.case?.category ?? "-"}
                        </span>
                      </div>
                      <h3 className="mt-1 truncate text-base text-text-primary group-hover:text-accent">
                        {r.title}
                      </h3>
                      {r.case?.prompt && (
                        <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                          {r.case.prompt}
                        </p>
                      )}
                    </div>

                    {/* 右: ステータス・メトリクス */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <StatusBadge
                        status={runStatusToHud(r.status, errorCount > 0)}
                      />
                      <span className="font-mono text-[11px] text-text-muted">
                        MODELS: {r.results.length}
                        {errorCount > 0 && (
                          <span className="text-danger"> (-{errorCount})</span>
                        )}
                      </span>
                      <span className="font-mono text-[11px] text-text-muted">
                        {new Date(r.createdAt).toLocaleString("ja-JP")}
                      </span>
                      <span className="hud-label text-[11px] text-accent opacity-0 transition-opacity group-hover:opacity-100">
                        DETAIL →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </HudPanel>
      )}
    </div>
  );
}
