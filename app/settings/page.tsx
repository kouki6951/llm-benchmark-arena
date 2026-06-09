import { PageHeader } from "@/components/hud/PageHeader";
import { HudPanel } from "@/components/hud/HudPanel";
import { StatusBadge } from "@/components/hud/StatusBadge";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const providers = [
    { name: "OpenAI", env: "OPENAI_API_KEY" },
    { name: "Anthropic", env: "ANTHROPIC_API_KEY" },
    { name: "Google", env: "GOOGLE_API_KEY" },
  ];
  const status = providers.map((p) => ({
    ...p,
    configured: Boolean(process.env[p.env]),
  }));
  const maxConcurrency = Number(process.env.MAX_CONCURRENCY ?? 3);

  return (
    <div className="max-w-3xl">
      <PageHeader code="SETTINGS // 設定" title="設定" />

      <div className="flex flex-col gap-5">
        <HudPanel title="API KEY STATUS // APIキー状態">
          <p className="mb-4 text-xs text-text-muted">
            APIキーは <span className="font-mono text-accent">.env.local</span>{" "}
            で管理されます。セキュリティのため、値はここに表示されません（設定済み/未設定のみ）。
          </p>
          <div className="flex flex-col gap-2">
            {status.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between border border-border bg-base px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm text-text-primary">{s.name}</span>
                  <span className="font-mono text-[11px] text-text-muted">
                    {s.env}
                  </span>
                </div>
                <StatusBadge
                  status={s.configured ? "online" : "warning"}
                  label={s.configured ? "CONFIGURED" : "MISSING"}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 border-l-2 border-warn/50 pl-3">
            <p className="text-xs text-text-muted">
              未設定のプロバイダーは実行前に弾かれます。プロジェクト直下の{" "}
              <span className="font-mono">.env.local.example</span> をコピーして{" "}
              <span className="font-mono">.env.local</span>{" "}
              を作成し、キーを設定後にサーバーを再起動してください。
            </p>
          </div>
        </HudPanel>

        <HudPanel title="JUDGE & EXECUTION // 実行設定">
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between border-b border-border/50 py-2">
              <span className="text-text-muted">既定Judgeモデル</span>
              <span className="text-text-primary">
                実行時に CASE 詳細画面で選択
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-text-muted">同時実行数（MAX_CONCURRENCY）</span>
              <span className="hud-label text-accent">{maxConcurrency}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-text-muted">
            同時実行数は <span className="font-mono">.env.local</span> の{" "}
            <span className="font-mono">MAX_CONCURRENCY</span>{" "}
            で変更できます（既定3）。レート制限・コスト暴発・PC負荷を抑制します。
          </p>
        </HudPanel>
      </div>
    </div>
  );
}
