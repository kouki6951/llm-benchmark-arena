/** LLM共通インターフェース定義 */

export interface LlmRequest {
  /** API上のモデル識別子 */
  model: string;
  /** 送信するプロンプト本文 */
  prompt: string;
  /** OpenAI互換APIのベースURL（任意） */
  apiBaseUrl?: string | null;
  /** 中断・タイムアウト制御 */
  signal?: AbortSignal;
  /** 最大出力トークン（任意） */
  maxTokens?: number;
}

export interface LlmResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export interface LlmClient {
  generate(req: LlmRequest): Promise<LlmResponse>;
}

/** APIキー未設定を表すエラー */
export class ApiKeyMissingError extends Error {
  code = "API_KEY_MISSING" as const;
  constructor(public provider: string) {
    super(`APIキーが未設定です: ${provider}`);
    this.name = "ApiKeyMissingError";
  }
}
