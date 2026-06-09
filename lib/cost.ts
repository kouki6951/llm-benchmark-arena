/**
 * 推定コスト計算
 * 推定コスト = (input_tokens / 1000) * input_cost_per_1k
 *            + (output_tokens / 1000) * output_cost_per_1k
 */
export function estimateCost(params: {
  inputTokens?: number | null;
  outputTokens?: number | null;
  inputCostPer1k?: number | null;
  outputCostPer1k?: number | null;
}): number {
  const inTok = params.inputTokens ?? 0;
  const outTok = params.outputTokens ?? 0;
  const inCost = params.inputCostPer1k ?? 0;
  const outCost = params.outputCostPer1k ?? 0;

  const cost = (inTok / 1000) * inCost + (outTok / 1000) * outCost;
  // 小数誤差を丸める（6桁）
  return Math.round(cost * 1e6) / 1e6;
}

/** USD表記の整形 */
export function formatCostUsd(cost?: number | null): string {
  if (cost == null) return "-";
  return `$${cost.toFixed(4)}`;
}
