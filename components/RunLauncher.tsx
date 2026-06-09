"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NeonButton } from "@/components/hud/NeonButton";
import { StatusBadge } from "@/components/hud/StatusBadge";

interface ModelOption {
  id: number;
  displayName: string;
  provider: string;
}

export function RunLauncher({
  caseId,
  models,
}: {
  caseId: number;
  models: ModelOption[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>(models.map((m) => m.id));
  const [judgeId, setJudgeId] = useState<number | null>(models[0]?.id ?? null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: number) {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  }

  async function launch() {
    setError(null);
    if (selected.length === 0) {
      setError("対象モデルを1つ以上選択してください");
      return;
    }
    if (!judgeId) {
      setError("Judgeモデルを選択してください");
      return;
    }
    setRunning(true);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          modelIds: selected,
          judgeModelId: judgeId,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error?.message ?? "実行に失敗しました");
      }
      const run = await res.json();
      router.push(`/runs/${run.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "実行に失敗しました");
      setRunning(false);
    }
  }

  if (models.length === 0) {
    return (
      <div className="clip-hud-sm border border-warn bg-warn/10 px-3 py-2">
        <span className="hud-label text-xs text-warn">
          WARNING // 有効なモデルがありません。MODELS画面で登録してください
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="clip-hud-sm border border-danger bg-danger/10 px-3 py-2">
          <span className="hud-label text-xs text-danger">ERROR // {error}</span>
        </div>
      )}

      <div>
        <div className="hud-label mb-2 text-[11px] text-text-muted">
          対象モデル
        </div>
        <div className="flex flex-wrap gap-2">
          {models.map((m) => {
            const on = selected.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggle(m.id)}
                className={`clip-hud-sm border px-3 py-1.5 text-xs transition-all ${
                  on
                    ? "border-accent text-accent shadow-glow"
                    : "border-border text-text-muted hover:border-accent/50"
                }`}
              >
                <span className="hud-label">{on ? "▣" : "▢"} {m.displayName}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="hud-label mb-2 text-[11px] text-text-muted">
          Judgeモデル（採点担当）
        </div>
        <select
          className="w-full max-w-xs border border-border bg-base px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:shadow-glow"
          value={judgeId ?? ""}
          onChange={(e) => setJudgeId(Number(e.target.value))}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <NeonButton type="button" onClick={launch} disabled={running}>
          {running ? "▶ ANALYZING..." : "▶ RUN BENCHMARK"}
        </NeonButton>
        {running && <StatusBadge status="analyzing" />}
      </div>
      {running && (
        <p className="text-xs text-text-muted">
          各モデルへ送信し、Judge採点まで実行しています。完了まで数十秒かかる場合があります…
        </p>
      )}
    </div>
  );
}
