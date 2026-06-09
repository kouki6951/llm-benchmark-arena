import { PageHeader } from "@/components/hud/PageHeader";
import { ModelManager } from "@/components/ModelManager";

export default function ModelsPage() {
  return (
    <div className="max-w-5xl">
      <PageHeader code="MODELS // モデル管理" title="モデル管理" />
      <ModelManager />
    </div>
  );
}
