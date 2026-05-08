import ModuleShell from "@/components/dashboard/ModuleShell";
import RealtimeAnalytics from "@/components/analytics/RealtimeAnalytics";
import { requireAccess } from "@/lib/access";
import { getAnalyticsSnapshot } from "@/lib/data/analytics";

export default async function Page() {
  await requireAccess("analytics");
  const snapshot = await getAnalyticsSnapshot();

  return (
    <ModuleShell
      title="Analytics IA"
      subtitle="Comptage vision, flux et validation des sessions IA."
      tag="IA Vision"
      tone="from-slate-900 via-slate-700 to-emerald-500"
      actions={[
        { label: "Nouvelle session", variant: "primary" },
        { label: "Mode live", variant: "outline" },
        { label: "Exporter", variant: "ghost" },
      ]}
    >
      <RealtimeAnalytics initial={snapshot} />
    </ModuleShell>
  );
}
