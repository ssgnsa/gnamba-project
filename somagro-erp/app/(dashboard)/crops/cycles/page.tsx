import ModuleShell from "@/components/dashboard/ModuleShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import ConfirmDeleteDrawer from "@/components/forms/ConfirmDeleteDrawer";
import { requireAccess } from "@/lib/access";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatNumber, formatPercent } from "@/lib/utils";
import CreateCycleForm from "@/components/forms/crops/CreateCycleForm";
import UpdateCycleForm from "@/components/forms/crops/UpdateCycleForm";

export default async function Page() {
  await requireAccess("crops");
  const supabase = createServerSupabase();

  const [{ data: cyclesData }, { data: fieldsData }] = await Promise.all([
    supabase
      .from("crop_cycles")
      .select(
        "id, name, field_id, crop_type, variety, start_date, end_date, status, notes",
      )
      .order("start_date", { ascending: false }),
    supabase
      .from("fields")
      .select("id, name")
      .order("name", { ascending: true }),
  ]);

  const cycles = cyclesData ?? [];
  const fields = fieldsData ?? [];

  // Build a map of field_id -> field_name for display
  const fieldMap = new Map(fields.map((f) => [f.id, f.name]));

  // Enrich cycles with field names
  const enrichedCycles = cycles.map((cycle) => ({
    ...cycle,
    field_name: cycle.field_id ? (fieldMap.get(cycle.field_id) ?? null) : null,
  }));

  // Metrics
  const totalCycles = cycles.length;
  const growingCount = cycles.filter((c) => c.status === "growing").length;
  const harvestedCount = cycles.filter((c) => c.status === "harvested").length;
  const failedCount = cycles.filter((c) => c.status === "failed").length;
  const plannedCount = cycles.filter((c) => c.status === "planned").length;
  const successRate =
    totalCycles > 0 ? (harvestedCount / totalCycles) * 100 : 0;

  // Recent cycles for the table
  const recentCycles = enrichedCycles.slice(0, 10);

  // Cycles needing attention (failed or planned with no start date)
  const attentionCycles = enrichedCycles
    .filter(
      (c) => c.status === "failed" || (c.status === "planned" && !c.start_date),
    )
    .slice(0, 3);

  return (
    <ModuleShell
      title="Cycles de culture"
      subtitle="Suivi des cycles de plantation, de la semis a la recolte."
      tag="Cultures"
      tone="from-emerald-950 via-emerald-700 to-teal-400"
      actions={[
        { label: "Nouveau cycle", variant: "primary", href: "?create=cycle" },
        {
          label: "Interventions",
          variant: "outline",
          href: "/crops/interventions",
        },
        { label: "Recoltes", variant: "ghost", href: "/crops/harvests" },
      ]}
    >
      <AutoRefresh intervalMs={90000} />
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Total cycles"
          value={formatNumber(totalCycles)}
          change="tous statuts"
          helper="somagro"
          tone="emerald"
        />
        <MetricCard
          label="En croissance"
          value={formatNumber(growingCount)}
          change={
            totalCycles > 0
              ? formatPercent((growingCount / totalCycles) * 100)
              : "0%"
          }
          helper="taux croissance"
          tone="sky"
        />
        <MetricCard
          label="Recoltes"
          value={formatNumber(harvestedCount)}
          change={formatPercent(successRate)}
          helper="taux succes"
          tone="emerald"
        />
        <MetricCard
          label="Echoues"
          value={formatNumber(failedCount)}
          change={`${formatNumber(plannedCount)} planifies`}
          helper="a surveiller"
          tone="amber"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Suivi des cycles
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Cycles recents
              </h2>
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            {recentCycles.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun cycle enregistre.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.15em] text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Nom</th>
                    <th className="pb-3 pr-4 font-medium">Parcelle</th>
                    <th className="pb-3 pr-4 font-medium">Culture</th>
                    <th className="pb-3 pr-4 font-medium">Statut</th>
                    <th className="pb-3 pr-4 font-medium">Debut</th>
                    <th className="pb-3 font-medium">Fin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentCycles.map((cycle) => {
                    const statusColors: Record<string, string> = {
                      planned: "bg-slate-100 text-slate-700",
                      growing: "bg-emerald-100 text-emerald-700",
                      harvested: "bg-amber-100 text-amber-700",
                      failed: "bg-rose-100 text-rose-700",
                    };
                    const statusLabels: Record<string, string> = {
                      planned: "Planifie",
                      growing: "Croissance",
                      harvested: "Recolte",
                      failed: "Echoue",
                    };
                    return (
                      <tr key={cycle.id} className="group">
                        <td className="py-3 pr-4 font-medium text-slate-900">
                          {cycle.name ?? "Sans nom"}
                        </td>
                        <td className="py-3 pr-4 text-slate-600">
                          {cycle.field_name ?? "N/A"}
                        </td>
                        <td className="py-3 pr-4 text-slate-600">
                          {cycle.crop_type ?? "--"}
                          {cycle.variety ? (
                            <span className="text-xs text-slate-400">
                              {" "}
                              ({cycle.variety})
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${statusColors[cycle.status ?? "planned"] ?? "bg-slate-100 text-slate-700"}`}
                          >
                            {statusLabels[cycle.status ?? "planned"] ??
                              cycle.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-600">
                          {cycle.start_date
                            ? new Date(cycle.start_date).toLocaleDateString(
                                "fr-FR",
                              )
                            : "--"}
                        </td>
                        <td className="py-3 text-slate-600">
                          {cycle.end_date
                            ? new Date(cycle.end_date).toLocaleDateString(
                                "fr-FR",
                              )
                            : "--"}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a
                              href={`?edit=cycle&id=${cycle.id}`}
                              className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600"
                            >
                              Modifier
                            </a>
                            <a
                              href={`?delete=cycle&id=${cycle.id}`}
                              className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-rose-700"
                            >
                              Suppr.
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Actions terrain
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Cycles a suivre
          </h2>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            {attentionCycles.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aucun cycle nécessitant une action.
              </p>
            ) : (
              attentionCycles.map((cycle) => (
                <div
                  key={cycle.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <p className="font-medium text-slate-900">
                    {cycle.name ?? "Cycle sans nom"}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Statut: {cycle.status ?? "--"} · Parcelle:{" "}
                    {cycle.field_name ?? "non assignee"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Culture: {cycle.crop_type ?? "non renseignee"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`?edit=cycle&id=${cycle.id}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                    >
                      Modifier
                    </a>
                    <a
                      href={`?delete=cycle&id=${cycle.id}`}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-700"
                    >
                      Supprimer
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <CreateCycleForm fields={fields} />
      <UpdateCycleForm cycles={enrichedCycles} fields={fields} />
      <ConfirmDeleteDrawer
        queryValue="cycle"
        table="crop_cycles"
        title="Supprimer le cycle de culture"
        description="Retirez ce cycle de la base de donnees de production."
        records={enrichedCycles.map((cycle) => ({
          id: cycle.id,
          label: cycle.name ?? "Cycle sans nom",
          description: `${cycle.crop_type ?? "culture non specifiee"} · ${cycle.field_name ?? "sans parcelle"} · ${cycle.status ?? "sans statut"}`,
        }))}
      />
    </ModuleShell>
  );
}
