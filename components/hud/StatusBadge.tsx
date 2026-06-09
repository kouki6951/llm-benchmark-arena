export type HudStatus =
  | "online"
  | "analyzing"
  | "judging"
  | "warning"
  | "error"
  | "standby"
  | "complete";

const MAP: Record<
  HudStatus,
  { label: string; color: string; dot: string; blink?: boolean }
> = {
  online: { label: "SYSTEM ONLINE", color: "text-accent", dot: "bg-accent" },
  complete: { label: "COMPLETE", color: "text-accent", dot: "bg-accent" },
  analyzing: {
    label: "ANALYZING...",
    color: "text-accent",
    dot: "bg-accent",
    blink: true,
  },
  judging: {
    label: "JUDGING...",
    color: "text-info",
    dot: "bg-info",
    blink: true,
  },
  warning: {
    label: "WARNING",
    color: "text-warn",
    dot: "bg-warn",
    blink: true,
  },
  error: { label: "ERROR", color: "text-danger", dot: "bg-danger", blink: true },
  standby: { label: "STANDBY", color: "text-text-muted", dot: "bg-text-muted" },
};

/** 六角形ドット + 英字ステータスラベル */
export function StatusBadge({
  status,
  label,
}: {
  status: HudStatus;
  label?: string;
}) {
  const s = MAP[status];
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`clip-hex h-2.5 w-2.5 ${s.dot} ${
          s.blink ? "animate-blink" : ""
        }`}
      />
      <span className={`hud-label text-xs ${s.color}`}>{label ?? s.label}</span>
    </span>
  );
}

/** DB上の run.status → HUDステータスへの変換 */
export function runStatusToHud(
  status: string,
  hasError?: boolean,
): HudStatus {
  if (status === "running") return "analyzing";
  if (status === "error") return "error";
  if (status === "done") return hasError ? "warning" : "complete";
  return "standby";
}
