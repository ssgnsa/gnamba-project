import ModuleShell from "@/components/dashboard/ModuleShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import ConfirmDeleteDrawer from "@/components/forms/ConfirmDeleteDrawer";
import { requireAccess } from "@/lib/access";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatNumber, formatPercent } from "@/lib/utils";
import CreateHarvestForm from "@/components/forms/crops/CreateHarvestForm";
import UpdateHarvestForm from "@/components/forms/crops/UpdateHarvestForm";

function resolveUnit(values: string[]) {
  const unique = Array.from(new Set(values.filter(Boolean)));
  if (unique.length === 1) return unique[0];
  if (unique.length === 0) return "";
  return "mix";
}

export default async function Page() {
  await requireAccess("crops");
  const supabase = createServerSupabase();
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const resolveCropType = (value: unknown) => {
    if (!value) return "Culture";
    if (Array.isArray(value)) return value[0]?.crop_type ?? "Culture";
    return (value as { crop_type?: string }).crop_type ?? "Culture";
  };

  const [{ data: harvestData }, { data: cyclesData }] = await Promise.all([
    supabase
      .from("harvests")
      .select(
        "id, crop_cycle_id, harvest_date, quantity, unit, quality_grade, destination, notes, crop_cycles(crop_type)",
      )
      .order("harvest_date", { ascending: false })
      .limit(10),
    supabase
      .from("crop_cycles")
      .select("id, crop_type")
      .order("crop_type", { ascending: true }),
  ]);

  const harvests = harvestData ?? [];
  const cycles = (cyclesData ?? []).map((cycle) => ({
    id: cycle.id,
    name: cycle.crop_type,
  }));
  const weeklyHarvests = harvests.filter(
    (row) => new Date(row.harvest_date) >= since,
  );
  const totalQuantity = weeklyHarvests.reduce(
    (sum, row) => sum + Number(row.quantity ?? 0),
    0,
  );
  const unit = resolveUnit(weeklyHarvests.map((row) => row.unit));

  const qualityA = harvests.filter(
    (row) => String(row.quality_grade ?? "").toLowerCase() === "a",
  ).length;
  const qualityRate =
    harvests.length > 0 ? (qualityA / harvests.length) * 100 : 0;
  const destinationSales = harvests.filter(
    (row) => row.destination === "sale",
  ).length;
  const saleRate =
    harvests.length > 0 ? (destinationSales / harvests.length) * 100 : 0;

  return (
    <ModuleShell
      title="Recoltes"
      subtitle="Volumes, qualite, affectation vente ou stockage."
      tag="Cultures"
      tone="from-emerald-900 via-emerald-700 to-amber-500"
      actions={[
        {
          label: "Nouvelle recolte",
          variant: "primary",
          href: "?create=harvest",
        },
        { label: "Synchro silos", variant: "outline" },
        { label: "Exporter", variant: "ghost" },
      ]}
    >
      <AutoRefresh intervalMs={90000} />
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Recolte semaine"
          value={`${formatNumber(totalQuantity)} ${unit}`.trim()}
          change="7j"
          helper="tous lots"
          tone="emerald"
        />
        <MetricCard
          label="Qualite A"
          value={formatPercent(qualityRate)}
          change="sur lots"
          helper="derniers lots"
          tone="sky"
        />
        <MetricCard
          label="Destination vente"
          value={formatPercent(saleRate)}
          change="vs stockage"
          helper="affectation"
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
                Recoltes recentes
              </h2>
            </div>
            <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Voir tout
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {harvests.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aucune recolte enregistree.
              </p>
            ) : (
              harvests.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {resolveCropType(item.crop_cycles)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Qualite: {item.quality_grade ?? "--"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>{formatDate(item.harvest_date)}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px]">
                        {item.quantity ?? 0} {item.unit ?? ""}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`?edit=harvest&id=${item.id}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                    >
                      Modifier
                    </a>
                    <a
                      href={`?delete=harvest&id=${item.id}`}
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
            Alerte qualite
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Suivi lots sensibles
          </h2>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            {harvests.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <p className="font-medium text-slate-900">
                  {resolveCropType(item.crop_cycles)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Destination: {item.destination ?? "--"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`?edit=harvest&id=${item.id}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                  >
                    Modifier
                  </a>
                  <a
                    href={`?delete=harvest&id=${item.id}`}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-700"
                  >
                    Supprimer
                  </a>
                </div>
              </div>
            ))}
            {harvests.length === 0 && (
              <p className="text-xs text-slate-500">Aucun lot critique.</p>
            )}
          </div>
        </div>
      </section>
      <CreateHarvestForm cycles={cycles} />
      <UpdateHarvestForm cycles={cycles} harvests={harvests} />
      <ConfirmDeleteDrawer
        queryValue="harvest"
        table="harvests"
        title="Supprimer la recolte"
        description="Retirez cette recolte du journal de production."
        records={harvests.map((item) => ({
          id: item.id,
          label: resolveCropType(item.crop_cycles),
          description:
            `${formatDate(item.harvest_date)} • ${formatNumber(item.quantity ?? 0)} ${item.unit ?? ""}`.trim(),
        }))}
      />
    </ModuleShell>
  );
}
