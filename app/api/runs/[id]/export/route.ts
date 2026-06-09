import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "@/lib/api";
import { buildRunCsv, CsvRunRow } from "@/lib/csv";

// GET /api/runs/:id/export
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const run = await prisma.benchmarkRun.findUnique({
    where: { id: Number(id) },
    include: {
      case: true,
      results: { include: { model: true, scores: true }, orderBy: { id: "asc" } },
    },
  });
  if (!run) return notFound();

  const rows: CsvRunRow[] = run.results.map((r) => {
    const s = r.scores[0] ?? null;
    return {
      caseTitle: run.case.title,
      modelName: r.model.displayName,
      response: r.response,
      totalScore: s?.totalScore ?? null,
      accuracy: s?.accuracy ?? null,
      coverage: s?.coverage ?? null,
      practicality: s?.practicality ?? null,
      readability: s?.readability ?? null,
      evidence: s?.evidence ?? null,
      latencyMs: r.latencyMs,
      estimatedCost: r.estimatedCost,
      judgeComment: s?.judgeComment ?? null,
    };
  });

  const csv = buildRunCsv(rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="run-${run.id}.csv"`,
    },
  });
}
