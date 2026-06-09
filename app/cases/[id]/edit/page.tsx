import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/hud/PageHeader";
import { HudPanel } from "@/components/hud/HudPanel";
import { CaseForm } from "@/components/CaseForm";

export const dynamic = "force-dynamic";

export default async function EditCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await prisma.benchmarkCase.findUnique({
    where: { id: Number(id) },
  });
  if (!c) notFound();

  return (
    <div className="max-w-3xl">
      <PageHeader code={`CASE #${c.id} // 編集`} title="評価テーマ編集" />
      <HudPanel title="EDIT CASE">
        <CaseForm
          initial={{
            id: c.id,
            title: c.title,
            category: c.category,
            prompt: c.prompt,
            rubricJson: c.rubricJson,
            expectedOutput: c.expectedOutput,
            memo: c.memo,
          }}
        />
      </HudPanel>
    </div>
  );
}
