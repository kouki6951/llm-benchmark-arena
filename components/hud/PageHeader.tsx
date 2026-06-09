import { ReactNode } from "react";

/** 画面上部のHUD見出し（英字コード + 日本語タイトル + 右アクション） */
export function PageHeader({
  code,
  title,
  children,
}: {
  code: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between border-b border-border pb-3">
      <div>
        <div className="hud-label text-[11px] text-accent glow">{code}</div>
        <h1 className="mt-1 text-2xl font-semibold text-text-primary">
          {title}
        </h1>
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
