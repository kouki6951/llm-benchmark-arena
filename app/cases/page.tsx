import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/hud/PageHeader";
import { HudPanel } from "@/components/hud/HudPanel";
import { NeonButton } from "@/components/hud/NeonButton";
import { HexIcon } from "@/components/hud/HexIcon";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const cases = await prisma.benchmarkCase.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader code="CASES // 評価テーマ" title="評価テーマ一覧">
        <Link href="/cases/new">
          <NeonButton>+ NEW CASE</NeonButton>
        </Link>
      </PageHeader>

      {cases.length === 0 ? (
        <HudPanel>
          <div className="flex flex-col items-center gap-3 py-12">
            <HexIcon size="h-14 w-14" className="text-text-muted">
              <span className="text-xs">∅</span>
            </HexIcon>
            <span className="hud-label text-sm text-text-muted">NO DATA</span>
            <span className="text-sm text-text-muted">
              評価テーマが未登録です
            </span>
            <Link href="/cases/new">
              <NeonButton>+ NEW CASE</NeonButton>
            </Link>
          </div>
        </HudPanel>
      ) : (
        <HudPanel title="REGISTERED CASES" meta={`COUNT: ${cases.length}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="hud-label py-2 text-[11px] text-text-muted">
                  タイトル
                </th>
                <th className="hud-label py-2 text-[11px] text-text-muted">
                  カテゴリ
                </th>
                <th className="hud-label py-2 text-[11px] text-text-muted">
                  更新日
                </th>
                <th className="hud-label py-2 text-right text-[11px] text-text-muted">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border/50 hover:bg-panel-alt"
                >
                  <td className="py-3 text-text-primary">{c.title}</td>
                  <td className="py-3">
                    <span className="clip-hud-sm border border-accent/40 px-2 py-0.5 text-xs text-accent">
                      {c.category}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-xs text-text-muted">
                    {new Date(c.updatedAt).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/cases/${c.id}`}
                      className="hud-label text-xs text-accent hover:glow"
                    >
                      DETAIL →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </HudPanel>
      )}
    </div>
  );
}
