import { ReactNode } from "react";

/** 六角形のアイコン枠 */
export function HexIcon({
  children,
  className = "",
  size = "h-10 w-10",
}: {
  children?: ReactNode;
  className?: string;
  size?: string;
}) {
  return (
    <span
      className={`clip-hex inline-flex items-center justify-center bg-panel-alt text-accent ${size} ${className}`}
    >
      {children}
    </span>
  );
}
