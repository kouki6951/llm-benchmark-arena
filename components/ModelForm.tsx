"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROVIDERS } from "@/lib/constants";
import { NeonButton } from "@/components/hud/NeonButton";

export interface ModelFormData {
  id?: number;
  provider: string;
  modelName: string;
  displayName: string;
  apiBaseUrl?: string | null;
  inputCostPer1k?: number | null;
  outputCostPer1k?: number | null;
  enabled: boolean;
}

const inputCls =
  "w-full border border-border bg-base px-3 py-2 text-sm text-text-primary outline-none transition-all focus:border-accent focus:shadow-glow";
const labelCls = "hud-label mb-1 block text-[11px] text-text-muted";

export function ModelForm({
  initial,
  onDone,
}: {
  initial?: ModelFormData;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ModelFormData>(
    initial ?? {
      provider: PROVIDERS[0],
      modelName: "",
      displayName: "",
      apiBaseUrl: "",
      inputCostPer1k: null,
      outputCostPer1k: null,
      enabled: true,
    },
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof ModelFormData, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.provider || !form.modelName || !form.displayName) {
      setError("プロバイダー・モデル名・表示名は必須です");
      return;
    }
    setSaving(true);
    try {
      const url = initial?.id ? `/api/models/${initial.id}` : "/api/models";
      const method = initial?.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error?.message ?? "保存に失敗しました");
      }
      onDone?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="clip-hud-sm border border-danger bg-danger/10 px-3 py-2">
          <span className="hud-label text-xs text-danger">ERROR // {error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>プロバイダー *</label>
          <select
            className={inputCls}
            value={form.provider}
            onChange={(e) => set("provider", e.target.value)}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>表示名 *</label>
          <input
            className={inputCls}
            value={form.displayName}
            onChange={(e) => set("displayName", e.target.value)}
            placeholder="例: Claude Opus 4.8"
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>モデル名（API識別子） *</label>
        <input
          className={`${inputCls} font-mono`}
          value={form.modelName}
          onChange={(e) => set("modelName", e.target.value)}
          placeholder="例: claude-opus-4-8"
        />
      </div>

      <div>
        <label className={labelCls}>
          APIエンドポイント（OpenAI互換時のみ・任意）
        </label>
        <input
          className={`${inputCls} font-mono`}
          value={form.apiBaseUrl ?? ""}
          onChange={(e) => set("apiBaseUrl", e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>入力単価 (per 1K) USD</label>
          <input
            type="number"
            step="0.0001"
            className={`${inputCls} font-mono`}
            value={form.inputCostPer1k ?? ""}
            onChange={(e) =>
              set(
                "inputCostPer1k",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </div>
        <div>
          <label className={labelCls}>出力単価 (per 1K) USD</label>
          <input
            type="number"
            step="0.0001"
            className={`${inputCls} font-mono`}
            value={form.outputCostPer1k ?? ""}
            onChange={(e) =>
              set(
                "outputCostPer1k",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => set("enabled", e.target.checked)}
          className="h-4 w-4 accent-[#39FF14]"
        />
        <span className="hud-label text-xs text-text-muted">
          ENABLED（実行対象に含める）
        </span>
      </label>

      <div className="flex gap-3">
        <NeonButton type="submit" disabled={saving}>
          {saving ? "SAVING..." : initial?.id ? "UPDATE" : "REGISTER"}
        </NeonButton>
        {onDone && (
          <NeonButton type="button" variant="ghost" onClick={onDone}>
            CANCEL
          </NeonButton>
        )}
      </div>
    </form>
  );
}
