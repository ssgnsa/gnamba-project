import DashboardLive from "@/components/dashboard/DashboardLive";
import { requireAccess } from "@/lib/access";
import { getDashboardSummary } from "@/lib/data/summary";

export default async function DashboardPage() {
  await requireAccess("dashboard");
  const summary = await getDashboardSummary();
  return <DashboardLive initial={summary} />;
}
