import { ReactNode } from "react";

/** グリッド + 放射グラデーションのHUD背景 */
export function GridBackground({ children }: { children: ReactNode }) {
  return (
    <div className="grid-bg grid-bg-radial min-h-screen">
      <div className="relative z-10">{children}</div>
    </div>
  );
}
