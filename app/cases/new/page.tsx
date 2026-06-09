import { PageHeader } from "@/components/hud/PageHeader";
import { HudPanel } from "@/components/hud/HudPanel";
import { CaseForm } from "@/components/CaseForm";

export default function NewCasePage() {
  return (
    <div className="max-w-3xl">
      <PageHeader code="CASES // 新規登録" title="評価テーマ登録" />
      <HudPanel title="NEW CASE">
        <CaseForm />
      </HudPanel>
    </div>
  );
}
