import ModuleShell from "@/components/dashboard/ModuleShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import ConfirmDeleteDrawer from "@/components/forms/ConfirmDeleteDrawer";
import { requireAccess } from "@/lib/access";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatNumber } from "@/lib/utils";
import CreateInterventionForm from "@/components/forms/crops/CreateInterventionForm";
import UpdateInterventionForm from "@/components/forms/crops/UpdateInterventionForm";

export default async function Page() {
  await requireAccess("crops");
  const supabase = createServerSupabase();
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const resolveCropType = (value: unknown) => {
    if (!value) return "--";
    if (Array.isArray(value)) return value[0]?.crop_type ?? "--";
    return (value as { crop_type?: string }).crop_type ?? "--";
  };

  const [
    { data: interventionsData },
    { data: cyclesData },
    { data: productsData },
    { data: usersData },
  ] = await Promise.all([
    supabase
      .from("crop_interventions")
      .select(
        "id, crop_cycle_id, intervention_type, product_id, quantity_used, unit, application_date, applied_by, notes, crop_cycles(crop_type)",
      )
      .order("application_date", { ascending: false })
      .limit(10),
    supabase
      .from("crop_cycles")
      .select("id, crop_type")
      .order("crop_type", { ascending: true }),
    supabase
      .from("inventory_items")
      .select("id, name")
      .order("name", { ascending: true }),
    supabase
      .from("users")
      .select("id, full_name")
      .order("full_name", { ascending: true }),
  ]);

  const interventions = interventionsData ?? [];
  const cycles = (cyclesData ?? []).map((cycle) => ({
    id: cycle.id,
    name: cycle.crop_type,
  }));
  const products = productsData ?? [];
  const users = usersData ?? [];
  const weeklyCount = interventions.filter(
    (row) => new Date(row.application_date) >= since,
  ).length;
  const uniqueTypes = new Set(interventions.map((row) => row.intervention_type))
    .size;
  const uniqueProducts = new Set(
    interventions.map((row) => row.product_id).filter(Boolean),
  ).size;

  return (
    <ModuleShell
      title="Interventions"
      subtitle="Traitements, irrigation, fertilisation et suivi agronomique."
      tag="Cultures"
      tone="from-emerald-900 via-emerald-700 to-lime-500"
      actions={[
        {
          label: "Nouvelle intervention",
          variant: "primary",
          href: "?create=intervention",
        },
        { label: "Plan hebdo", variant: "outline" },
        { label: "Exporter", variant: "ghost" },
      ]}
    >
      <AutoRefresh intervalMs={90000} />
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Interventions semaine"
          value={formatNumber(weeklyCount)}
          change="7j"
          helper="operations terrain"
          tone="sky"
        />
        <MetricCard
          label="Types actifs"
          value={formatNumber(uniqueTypes)}
          change="en cours"
          helper="categories"
          tone="emerald"
        />
        <MetricCard
          label="Produits utilises"
          value={formatNumber(uniqueProducts)}
          change="distincts"
          helper="inventaire"
          tone="amber"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Journal
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Dernieres interventions
              </h2>
            </div>
            <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Voir tout
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {interventions.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aucune intervention enregistree.
              </p>
            ) : (
              interventions.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.intervention_type}
                      </p>
                      <p className="text-xs text-slate-500">
                        Culture: {resolveCropType(item.crop_cycles)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>{formatDate(item.application_date)}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px]">
                        {item.quantity_used ?? "--"} {item.unit ?? ""}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`?edit=intervention&id=${item.id}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                    >
                      Modifier
                    </a>
                    <a
                      href={`?delete=intervention&id=${item.id}`}
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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            A planifier
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Prochaines actions
          </h2>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            {interventions.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <p className="font-medium text-slate-900">
                  {item.intervention_type}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Culture: {resolveCropType(item.crop_cycles)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`?edit=intervention&id=${item.id}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                  >
                    Modifier
                  </a>
                  <a
                    href={`?delete=intervention&id=${item.id}`}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-700"
                  >
                    Supprimer
                  </a>
                </div>
              </div>
            ))}
            {interventions.length === 0 && (
              <p className="text-xs text-slate-500">Aucune action planifiee.</p>
            )}
          </div>
        </div>
      </section>
      <CreateInterventionForm
        cycles={cycles}
        products={products}
        users={users}
      />
      <UpdateInterventionForm
        cycles={cycles}
        products={products}
        users={users}
        interventions={interventions}
      />
      <ConfirmDeleteDrawer
        queryValue="intervention"
        table="crop_interventions"
        title="Supprimer l intervention"
        description="Retirez cette intervention du suivi agronomique."
        records={interventions.map((item) => ({
          id: item.id,
          label: item.intervention_type ?? "Intervention",
          description: `${resolveCropType(item.crop_cycles)} • ${formatDate(item.application_date)}`,
        }))}
      />
    </ModuleShell>
  );
}
