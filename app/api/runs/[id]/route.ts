import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { internalError, notFound } from "@/lib/api";

// GET /api/runs/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const run = await prisma.benchmarkRun.findUnique({
      where: { id: Number(id) },
      include: {
        case: true,
        results: {
          include: { model: true, scores: true },
          orderBy: { id: "asc" },
        },
      },
    });
    if (!run) return notFound();

    const results = run.results.map((r) => {
      const score = r.scores[0] ?? null;
      return {
        id: r.id,
        modelId: r.modelId,
        modelDisplayName: r.model.displayName,
        provider: r.model.provider,
        response: r.response,
        latencyMs: r.latencyMs,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        estimatedCost: r.estimatedCost,
        status: r.status,
        errorMessage: r.errorMessage,
        score: score
          ? {
              accuracy: score.accuracy,
              coverage: score.coverage,
              practicality: score.practicality,
              readability: score.readability,
              evidence: score.evidence,
              totalScore: score.totalScore,
              judgeComment: score.judgeComment,
              rawJudgeResponse: score.rawJudgeResponse,
              judgeProvider: score.judgeProvider,
              judgeModel: score.judgeModel,
            }
          : null,
      };
    });

    return NextResponse.json({
      id: run.id,
      title: run.title,
      status: run.status,
      caseId: run.caseId,
      caseTitle: run.case.title,
      category: run.case.category,
      prompt: run.case.prompt,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      results,
    });
  } catch (e) {
    console.error(e);
    return internalError();
  }
}
