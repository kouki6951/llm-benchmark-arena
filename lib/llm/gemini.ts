import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiKeyMissingError, LlmClient, LlmRequest, LlmResponse } from "./types";

/** Google Gemini クライアント */
export class GeminiClient implements LlmClient {
  async generate(req: LlmRequest): Promise<LlmResponse> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new ApiKeyMissingError("Google");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: req.model });

    const start = Date.now();
    const result = await model.generateContent(
      {
        contents: [{ role: "user", parts: [{ text: req.prompt }] }],
        generationConfig: req.maxTokens
          ? { maxOutputTokens: req.maxTokens }
          : undefined,
      },
      { signal: req.signal },
    );
    const latencyMs = Date.now() - start;

    const text = result.response.text();
    const usage = result.response.usageMetadata;

    return {
      text,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      latencyMs,
    };
  }
}
