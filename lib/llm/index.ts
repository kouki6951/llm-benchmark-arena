import { AnthropicClient } from "./anthropic";
import { GeminiClient } from "./gemini";
import { OpenAiClient } from "./openai";
import { LlmClient } from "./types";

export * from "./types";

/**
 * provider 文字列から LLMクライアントを解決する。
 * OpenAI互換APIは "OpenAI互換" / "openai-compatible" として OpenAiClient を再利用する。
 */
export function resolveClient(provider: string): LlmClient {
  const p = provider.trim().toLowerCase();

  switch (p) {
    case "openai":
      return new OpenAiClient("OpenAI");
    case "anthropic":
      return new AnthropicClient();
    case "google":
    case "gemini":
      return new GeminiClient();
    case "openai互換":
    case "openai-compatible":
    case "compatible":
      return new OpenAiClient("OpenAI互換");
    default:
      // 未知プロバイダーはOpenAI互換として扱う（apiBaseUrl利用前提）
      return new OpenAiClient(provider);
  }
}

/** プロバイダーに対応する環境変数のキー名 */
export function envKeyForProvider(provider: string): string | null {
  const p = provider.trim().toLowerCase();
  if (p === "openai" || p.includes("互換") || p === "openai-compatible")
    return "OPENAI_API_KEY";
  if (p === "anthropic") return "ANTHROPIC_API_KEY";
  if (p === "google" || p === "gemini") return "GOOGLE_API_KEY";
  return null;
}

/** APIキーが設定済みか */
export function isApiKeyConfigured(provider: string): boolean {
  const key = envKeyForProvider(provider);
  if (!key) return false;
  return Boolean(process.env[key]);
}
