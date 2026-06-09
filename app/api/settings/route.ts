import { NextResponse } from "next/server";

// GET /api/settings — APIキーは値を返さず「設定済み/未設定」のみ返す
export async function GET() {
  return NextResponse.json({
    apiKeys: {
      OpenAI: Boolean(process.env.OPENAI_API_KEY),
      Anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      Google: Boolean(process.env.GOOGLE_API_KEY),
    },
    maxConcurrency: Number(process.env.MAX_CONCURRENCY ?? 3),
  });
}
