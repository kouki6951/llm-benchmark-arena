import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/hud/PageHeader";
import { HudPanel } from "@/components/hud/HudPanel";
import { NeonButton } from "@/components/hud/NeonButton";
import { RunLauncher } from "@/components/RunLauncher";
import { DeleteButton } from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await prisma.benchmarkCase.findUnique({
    where: { id: Number(id) },
  });
  if (!c) notFound();

  const models = await prisma.benchmarkModel.findMany({
    where: { enabled: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="max-w-4xl">
      <PageHeader code={`CASE #${c.id}`} title={c.title}>
        <Link href={`/cases/${c.id}/edit`}>
          <NeonButton variant="ghost">EDIT</NeonButton>
        </Link>
        <DeleteButton url={`/api/cases/${c.id}`} redirectTo="/cases" />
      </PageHeader>

      <div className="flex flex-col gap-5">
        <HudPanel title="CASE DETAIL" meta={c.category}>
          <dl className="flex flex-col gap-4 text-sm">
            <Field label="プロンプト本文">
              <pre className="whitespace-pre-wrap font-mono text-text-primary">
                {c.prompt}
              </pre>
            </Field>
            {c.rubricJson && (
              <Field label="評価観点 / Rubric">
                <pre className="whitespace-pre-wrap font-mono text-text-muted">
                  {c.rubricJson}
                </pre>
              </Field>
            )}
            {c.expectedOutput && (
              <Field label="想定する成果物">
                <p className="text-text-primary">{c.expectedOutput}</p>
              </Field>
            )}
            {c.memo && (
              <Field label="備考">
                <p className="text-text-muted">{c.memo}</p>
              </Field>
            )}
          </dl>
        </HudPanel>

        <HudPanel title="RUN // このテーマで実行" glow>
          <RunLauncher
            caseId={c.id}
            models={models.map((m) => ({
              id: m.id,
              displayName: m.displayName,
              provider: m.provider,
            }))}
          />
        </HudPanel>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="hud-label mb-1 text-[11px] text-text-muted">{label}</dt>
      <dd className="border-l-2 border-border pl-3">{children}</dd>
    </div>
  );
}
