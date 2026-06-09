import Anthropic from "@anthropic-ai/sdk";
import { ApiKeyMissingError, LlmClient, LlmRequest, LlmResponse } from "./types";

/** Anthropic (Claude) クライアント */
export class AnthropicClient implements LlmClient {
  async generate(req: LlmRequest): Promise<LlmResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new ApiKeyMissingError("Anthropic");

    const client = new Anthropic({
      apiKey,
      baseURL: req.apiBaseUrl || undefined,
    });

    const start = Date.now();
    const message = await client.messages.create(
      {
        model: req.model,
        max_tokens: req.maxTokens ?? 4096,
        messages: [{ role: "user", content: req.prompt }],
      },
      { signal: req.signal },
    );
    const latencyMs = Date.now() - start;

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return {
      text,
      inputTokens: message.usage?.input_tokens ?? 0,
      outputTokens: message.usage?.output_tokens ?? 0,
      latencyMs,
    };
  }
}
