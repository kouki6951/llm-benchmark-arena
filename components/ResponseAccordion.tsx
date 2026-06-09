"use client";

import { useState } from "react";
import { formatCostUsd } from "@/lib/cost";

/** 「回答を確認する」トグルで回答全文を開閉表示するアコーディオン */
export function ResponseAccordion({
  response,
  latencyMs,
  inputTokens,
  outputTokens,
  estimatedCost,
}: {
  response: string | null;
  latencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCost: number | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 border-t border-border pt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="hud-label flex items-center gap-2 text-xs text-accent transition-all hover:glow"
      >
        <span>{open ? "▼" : "▶"}</span>
        回答を確認する
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap gap-4 font-mono text-xs text-text-muted">
            <span>LATENCY: {latencyMs ?? "-"}ms</span>
            <span>
              TOKENS: {inputTokens ?? 0} in / {outputTokens ?? 0} out
            </span>
            <span>COST: {formatCostUsd(estimatedCost)}</span>
          </div>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap border border-border bg-base p-3 font-mono text-xs text-text-primary">
            {response || "(空)"}
          </pre>
        </div>
      )}
    </div>
  );
}
