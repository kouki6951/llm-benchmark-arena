"use client";

import { useEffect, useState } from "react";
import { HudPanel } from "@/components/hud/HudPanel";
import { NeonButton } from "@/components/hud/NeonButton";
import { HexIcon } from "@/components/hud/HexIcon";
import { ModelForm, ModelFormData } from "@/components/ModelForm";
import { formatCostUsd } from "@/lib/cost";

interface Model extends ModelFormData {
  id: number;
}

export function ModelManager() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Model | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/models");
    const data = await res.json();
    setModels(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(m: Model) {
    await fetch(`/api/models/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !m.enabled }),
    });
    load();
  }

  async function remove(m: Model) {
    if (!window.confirm(`${m.displayName} を削除しますか？`)) return;
    await fetch(`/api/models/${m.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="flex flex-col gap-5">
      {(adding || editing) && (
        <HudPanel title={editing ? "EDIT MODEL" : "NEW MODEL"} glow>
          <ModelForm
            initial={editing ?? undefined}
            onDone={() => {
              setAdding(false);
              setEditing(null);
              load();
            }}
          />
        </HudPanel>
      )}

      <HudPanel
        title="MODELS // モデル一覧"
        meta={loading ? "LOADING..." : `COUNT: ${models.length}`}
      >
        {!adding && !editing && (
          <div className="mb-3">
            <NeonButton onClick={() => setAdding(true)}>+ ADD MODEL</NeonButton>
          </div>
        )}

        {models.length === 0 && !loading ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <HexIcon size="h-12 w-12" className="text-text-muted">
              ∅
            </HexIcon>
            <span className="hud-label text-sm text-text-muted">NO MODELS</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["表示名", "プロバイダー", "モデル名", "入力/出力単価", "状態", "操作"].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={`hud-label py-2 text-[11px] text-text-muted ${
                        i >= 4 ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-border/50 hover:bg-panel-alt"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <HexIcon size="h-6 w-6" className="text-[10px]">
                        {m.provider.slice(0, 1)}
                      </HexIcon>
                      <span className="text-text-primary">{m.displayName}</span>
                    </div>
                  </td>
                  <td className="py-3 text-text-muted">{m.provider}</td>
                  <td className="py-3 font-mono text-xs text-text-muted">
                    {m.modelName}
                  </td>
                  <td className="py-3 font-mono text-xs text-text-muted">
                    {formatCostUsd(m.inputCostPer1k)} / {formatCostUsd(m.outputCostPer1k)}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => toggle(m)}
                      className={`hud-label clip-hud-sm border px-2 py-1 text-[11px] transition-all ${
                        m.enabled
                          ? "border-accent text-accent shadow-glow"
                          : "border-border text-text-muted"
                      }`}
                    >
                      {m.enabled ? "● ENABLED" : "○ DISABLED"}
                    </button>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditing(m);
                          setAdding(false);
                        }}
                        className="hud-label text-[11px] text-info hover:underline"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => remove(m)}
                        className="hud-label text-[11px] text-danger hover:underline"
                      >
                        DEL
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </HudPanel>
    </div>
  );
}
