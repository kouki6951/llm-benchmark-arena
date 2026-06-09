"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CASE_CATEGORIES } from "@/lib/constants";
import { NeonButton } from "@/components/hud/NeonButton";

export interface CaseFormData {
  id?: number;
  title: string;
  category: string;
  prompt: string;
  rubricJson?: string | null;
  expectedOutput?: string | null;
  memo?: string | null;
}

const inputCls =
  "w-full border border-border bg-base px-3 py-2 text-sm text-text-primary outline-none transition-all focus:border-accent focus:shadow-glow";
const labelCls = "hud-label mb-1 block text-[11px] text-text-muted";

export function CaseForm({ initial }: { initial?: CaseFormData }) {
  const router = useRouter();
  const [form, setForm] = useState<CaseFormData>(
    initial ?? {
      title: "",
      category: CASE_CATEGORIES[0],
      prompt: "",
      rubricJson: "",
      expectedOutput: "",
      memo: "",
    },
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof CaseFormData, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title || !form.category || !form.prompt) {
      setError("タイトル・カテゴリ・プロンプト本文は必須です");
      return;
    }
    setSaving(true);
    try {
      const url = initial?.id ? `/api/cases/${initial.id}` : "/api/cases";
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
      const saved = await res.json();
      router.push(`/cases/${saved.id}`);
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

      <div>
        <label className={labelCls}>タイトル *</label>
        <input
          className={inputCls}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="例: Terraform構築"
        />
      </div>

      <div>
        <label className={labelCls}>カテゴリ *</label>
        <select
          className={inputCls}
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
        >
          {CASE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>プロンプト本文 *</label>
        <textarea
          className={`${inputCls} min-h-[160px] font-mono`}
          value={form.prompt}
          onChange={(e) => set("prompt", e.target.value)}
          placeholder="各モデルへ送信する評価プロンプト"
        />
      </div>

      <div>
        <label className={labelCls}>評価観点 / Rubric（任意・JSON可）</label>
        <textarea
          className={`${inputCls} min-h-[80px] font-mono`}
          value={form.rubricJson ?? ""}
          onChange={(e) => set("rubricJson", e.target.value)}
        />
      </div>

      <div>
        <label className={labelCls}>想定する成果物（任意）</label>
        <textarea
          className={`${inputCls} min-h-[60px]`}
          value={form.expectedOutput ?? ""}
          onChange={(e) => set("expectedOutput", e.target.value)}
        />
      </div>

      <div>
        <label className={labelCls}>備考（任意）</label>
        <textarea
          className={`${inputCls} min-h-[60px]`}
          value={form.memo ?? ""}
          onChange={(e) => set("memo", e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <NeonButton type="submit" disabled={saving}>
          {saving ? "SAVING..." : initial?.id ? "UPDATE" : "REGISTER"}
        </NeonButton>
        <NeonButton
          type="button"
          variant="ghost"
          onClick={() => router.back()}
        >
          CANCEL
        </NeonButton>
      </div>
    </form>
  );
}
