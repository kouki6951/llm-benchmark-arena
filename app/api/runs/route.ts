import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { internalError, validationError } from "@/lib/api";
import { isApiKeyConfigured } from "@/lib/llm";
import { executeRun } from "@/lib/runner";

// GET /api/runs
export async function GET() {
  try {
    const runs = await prisma.benchmarkRun.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        results: { select: { status: true } },
      },
    });
    const shaped = runs.map((r) => ({
      id: r.id,
      caseId: r.caseId,
      title: r.title,
      status: r.status,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      createdAt: r.createdAt,
      modelCount: r.results.length,
      errorCount: r.results.filter((x) => x.status === "error").length,
    }));
    return NextResponse.json(shaped);
  } catch (e) {
    console.error(e);
    return internalError();
  }
}

// POST /api/runs
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseId, modelIds, judgeModelId } = body;

    if (!caseId || !Array.isArray(modelIds) || modelIds.length === 0 || !judgeModelId) {
      return validationError("caseId, modelIds[], judgeModelId は必須です");
    }

    const benchmarkCase = await prisma.benchmarkCase.findUnique({
      where: { id: Number(caseId) },
    });
    if (!benchmarkCase) return validationError("指定されたテーマが存在しません");

    // 実行前バリデーション: 対象モデル＋JudgeのプロバイダーのAPIキー確認
    const allModelIds = Array.from(new Set([...modelIds, judgeModelId])).map(
      Number,
    );
    const models = await prisma.benchmarkModel.findMany({
      where: { id: { in: allModelIds } },
    });
    const missing = models.filter((m) => !isApiKeyConfigured(m.provider));
    if (missing.length > 0) {
      const providers = Array.from(new Set(missing.map((m) => m.provider)));
      return NextResponse.json(
        {
          error: {
            code: "API_KEY_MISSING",
            message: `APIキー未設定: ${providers.join(", ")}。設定画面で確認してください。`,
          },
        },
        { status: 400 },
      );
    }

    const run = await prisma.benchmarkRun.create({
      data: {
        caseId: Number(caseId),
        title: benchmarkCase.title,
        status: "running",
      },
    });

    // MVPは同期実行（ローカル・単一ユーザー前提）。完了後にrunを返す。
    await executeRun({
      runId: run.id,
      caseId: Number(caseId),
      modelIds: modelIds.map(Number),
      judgeModelId: Number(judgeModelId),
    });

    const finished = await prisma.benchmarkRun.findUnique({
      where: { id: run.id },
    });
    return NextResponse.json(finished, { status: 201 });
  } catch (e) {
    console.error(e);
    return internalError();
  }
}
