import OpenAI from "openai";
import { ApiKeyMissingError, LlmClient, LlmRequest, LlmResponse } from "./types";

/**
 * OpenAI / OpenAI互換API クライアント。
 * apiBaseUrl を渡すと OpenAI互換エンドポイントとして再利用できる。
 */
export class OpenAiClient implements LlmClient {
  constructor(private providerLabel = "OpenAI") {}

  async generate(req: LlmRequest): Promise<LlmResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new ApiKeyMissingError(this.providerLabel);

    const client = new OpenAI({
      apiKey,
      baseURL: req.apiBaseUrl || undefined,
    });

    const start = Date.now();
    const completion = await client.chat.completions.create(
      {
        model: req.model,
        messages: [{ role: "user", content: req.prompt }],
        max_tokens: req.maxTokens,
      },
      { signal: req.signal },
    );
    const latencyMs = Date.now() - start;

    const text = completion.choices[0]?.message?.content ?? "";
    return {
      text,
      inputTokens: completion.usage?.prompt_tokens ?? 0,
      outputTokens: completion.usage?.completion_tokens ?? 0,
      latencyMs,
    };
  }
}
