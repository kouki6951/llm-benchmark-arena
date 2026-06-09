"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NeonButton } from "@/components/hud/NeonButton";

/** 確認付き削除ボタン（汎用） */
export function DeleteButton({
  url,
  redirectTo,
  label = "DELETE",
  confirmText = "削除しますか？この操作は取り消せません。",
}: {
  url: string;
  redirectTo?: string;
  label?: string;
  confirmText?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    try {
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "削除に失敗しました");
      setBusy(false);
    }
  }

  return (
    <NeonButton type="button" variant="danger" onClick={onDelete} disabled={busy}>
      {busy ? "..." : label}
    </NeonButton>
  );
}
