import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "accent" | "danger" | "ghost";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
}

const VARIANT: Record<Variant, string> = {
  accent:
    "border-accent text-accent hover:bg-accent/10 hover:shadow-glow",
  danger:
    "border-danger text-danger hover:bg-danger/10 hover:shadow-glow-danger",
  ghost:
    "border-border text-text-muted hover:border-accent hover:text-accent",
};

/** 蛍光グリーン / 赤の発光ボタン（角丸なし・斜めカット） */
export function NeonButton({
  children,
  variant = "accent",
  className = "",
  ...rest
}: NeonButtonProps) {
  return (
    <button
      {...rest}
      className={`clip-hud-sm hud-label border bg-transparent px-4 py-2 text-xs transition-all disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
