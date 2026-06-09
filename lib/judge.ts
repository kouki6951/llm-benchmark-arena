import { resolveClient } from "./llm";

export interface JudgeScore {
  accuracy: number;
  coverage: number;
  practicality: number;
  readability: number;
  evidence: number;
  total: number;
  comment: string;
}

export interface JudgeResult {
  score: JudgeScore | null;
  /** JSONパースに失敗した場合の生レスポンス */
  raw: string;
}

/** Judgeプロンプトを生成する */
export function buildJudgePrompt(prompt: string, response: string): string {
  return `あなたは厳格な技術評価者です。

以下の評価テーマに対するLLMの回答を採点してください。

# 評価テーマ
${prompt}

# 回答
${response}

# 評価基準
- 正確性: 40点
- 網羅性: 20点
- 実用性: 20点
- 可読性: 10点
- 根拠の明確さ: 10点

# 出力形式
必ず以下のJSON形式のみで返してください。説明やコードブロックは不要です。

{
  "accuracy": number,
  "coverage": number,
  "practicality": number,
  "readability": number,
  "evidence": number,
  "total": number,
  "comment": string
}`;
}

/** レスポンス文字列からJSONを抽出してパースする */
export function parseJudgeResponse(text: string): JudgeScore | null {
  if (!text) return null;
  // コードフェンスや前後テキストを許容して最初の { ... } を抽出する
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  const jsonStr = text.slice(start, end + 1);
  try {
    const obj = JSON.parse(jsonStr);
    const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

    const accuracy = num(obj.accuracy);
    const coverage = num(obj.coverage);
    const practicality = num(obj.practicality);
    const readability = num(obj.readability);
    const evidence = num(obj.evidence);
    // total が無い／合計と乖離する場合はサーバー側で再計算した値を採用
    const sum = accuracy + coverage + practicality + readability + evidence;
    const total =
      typeof obj.total === "number" && Math.abs(obj.total - sum) <= 1
        ? obj.total
        : sum;

    return {
      accuracy,
      coverage,
      practicality,
      readability,
      evidence,
      total,
      comment: typeof obj.comment === "string" ? obj.comment : "",
    };
  } catch {
    return null;
  }
}

/** Judge LLM を呼び出して採点する */
export async function runJudge(params: {
  judgeProvider: string;
  judgeModel: string;
  apiBaseUrl?: string | null;
  prompt: string;
  response: string;
  signal?: AbortSignal;
}): Promise<JudgeResult> {
  const client = resolveClient(params.judgeProvider);
  const judgePrompt = buildJudgePrompt(params.prompt, params.response);

  const res = await client.generate({
    model: params.judgeModel,
    prompt: judgePrompt,
    apiBaseUrl: params.apiBaseUrl,
    signal: params.signal,
  });

  const score = parseJudgeResponse(res.text);
  return { score, raw: res.text };
}
