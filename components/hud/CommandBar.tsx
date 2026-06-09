import { StatusBadge } from "./StatusBadge";
import { isApiKeyConfigured } from "@/lib/llm";

/** 最上部コマンドバー（管制ヘッダー） */
export function CommandBar() {
  const providers = ["OpenAI", "Anthropic", "Google"];
  const connected = providers.filter((p) => isApiKeyConfigured(p)).length;
  const allConnected = connected === providers.length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-base/90 px-4 py-2 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="text-accent glow">◢◤</span>
        <span className="hud-label text-sm text-text-primary">
          LLM BENCHMARK ARENA
        </span>
      </div>
      <div className="flex items-center gap-5">
        <span className="hud-label text-[11px] text-text-muted">
          PROVIDERS:
          <span className={allConnected ? "text-accent" : "text-warn"}>
            {" "}
            {connected}/{providers.length}
          </span>
        </span>
        <StatusBadge status={allConnected ? "online" : "warning"} />
      </div>
    </header>
  );
}
