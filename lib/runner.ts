import pLimit from "p-limit";
import { prisma } from "./prisma";
import { resolveClient } from "./llm";
import { estimateCost } from "./cost";
import { runJudge } from "./judge";

const MAX_CONCURRENCY = Number(process.env.MAX_CONCURRENCY ?? 3);
const TIMEOUT_MS = 120_000;

/**
 * 1つの run を実行する。各モデルへ並列送信 → 結果保存 → Judge採点。
 * 同時実行数は p-limit で制限し、Promise.allSettled で一部失敗を許容する。
 */
export async function executeRun(params: {
  runId: number;
  caseId: number;
  modelIds: number[];
  judgeModelId: number;
}) {
  const { runId, caseId, modelIds, judgeModelId } = params;

  const benchmarkCase = await prisma.benchmarkCase.findUnique({
    where: { id: caseId },
  });
  if (!benchmarkCase) throw new Error("case not found");

  const models = await prisma.benchmarkModel.findMany({
    where: { id: { in: modelIds } },
  });
  const judgeModel = await prisma.benchmarkModel.findUnique({
    where: { id: judgeModelId },
  });

  const limit = pLimit(MAX_CONCURRENCY);

  await prisma.benchmarkRun.update({
    where: { id: runId },
    data: { status: "running", startedAt: new Date() },
  });

  // ===== 各モデルへ並列実行 =====
  const tasks = models.map((model) =>
    limit(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const client = resolveClient(model.provider);
        const res = await client.generate({
          model: model.modelName,
          prompt: benchmarkCase.prompt,
          apiBaseUrl: model.apiBaseUrl,
          signal: controller.signal,
        });

        const estimatedCost = estimateCost({
          inputTokens: res.inputTokens,
          outputTokens: res.outputTokens,
          inputCostPer1k: model.inputCostPer1k,
          outputCostPer1k: model.outputCostPer1k,
        });

        const result = await prisma.benchmarkRunResult.create({
          data: {
            runId,
            modelId: model.id,
            response: res.text,
            latencyMs: res.latencyMs,
            inputTokens: res.inputTokens,
            outputTokens: res.outputTokens,
            estimatedCost,
            status: "success",
          },
        });
        return { result, response: res.text };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "unknown error";
        await prisma.benchmarkRunResult.create({
          data: {
            runId,
            modelId: model.id,
            status: "error",
            errorMessage: message,
          },
        });
        return null;
      } finally {
        clearTimeout(timer);
      }
    }),
  );

  const settled = await Promise.allSettled(tasks);
  const succeeded = settled
    .filter(
      (s): s is PromiseFulfilledResult<{ result: any; response: string }> =>
        s.status === "fulfilled" && s.value !== null,
    )
    .map((s) => s.value);

  // ===== Judge採点（成功回答のみ） =====
  if (judgeModel) {
    const judgeTasks = succeeded.map((item) =>
      limit(async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
          const { score, raw } = await runJudge({
            judgeProvider: judgeModel.provider,
            judgeModel: judgeModel.modelName,
            apiBaseUrl: judgeModel.apiBaseUrl,
            prompt: benchmarkCase.prompt,
            response: item.response,
            signal: controller.signal,
          });

          await prisma.benchmarkScore.create({
            data: {
              resultId: item.result.id,
              judgeProvider: judgeModel.provider,
              judgeModel: judgeModel.modelName,
              accuracy: score?.accuracy ?? null,
              coverage: score?.coverage ?? null,
              practicality: score?.practicality ?? null,
              readability: score?.readability ?? null,
              evidence: score?.evidence ?? null,
              totalScore: score?.total ?? null,
              judgeComment: score?.comment ?? null,
              rawJudgeResponse: score ? null : raw,
            },
          });
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "judge error";
          await prisma.benchmarkScore.create({
            data: {
              resultId: item.result.id,
              judgeProvider: judgeModel.provider,
              judgeModel: judgeModel.modelName,
              rawJudgeResponse: `JUDGE_ERROR: ${message}`,
            },
          });
        } finally {
          clearTimeout(timer);
        }
      }),
    );
    await Promise.allSettled(judgeTasks);
  }

  // ===== run ステータス確定 =====
  const finalStatus = succeeded.length === 0 ? "error" : "done";
  await prisma.benchmarkRun.update({
    where: { id: runId },
    data: { status: finalStatus, finishedAt: new Date() },
  });
}
