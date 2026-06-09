import { ReactNode } from "react";

interface HudPanelProps {
  children: ReactNode;
  /** パネル見出し（HUDラベル） */
  title?: string;
  /** 見出し右側の補助情報 */
  meta?: ReactNode;
  className?: string;
  /** 実行中演出のスキャンライン */
  scanline?: boolean;
  /** アクセント発光の枠 */
  glow?: boolean;
}

/** 斜めカット + コーナーマーカー付きの計器パネル */
export function HudPanel({
  children,
  title,
  meta,
  className = "",
  scanline = false,
  glow = false,
}: HudPanelProps) {
  return (
    <div className={`relative ${className}`}>
      {/* 本体（斜めカット） */}
      <div
        className={`clip-hud border border-border bg-panel ${
          glow ? "glow-box" : ""
        } ${scanline ? "scanline" : ""}`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="hud-label text-xs text-accent glow">{title}</span>
            {meta && (
              <span className="hud-label text-[11px] text-text-muted">
                {meta}
              </span>
            )}
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>

      {/* コーナーマーカー */}
      <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-accent" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-accent" />
    </div>
  );
}
