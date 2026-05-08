import ModuleShell from "@/components/dashboard/ModuleShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import ConfirmDeleteDrawer from "@/components/forms/ConfirmDeleteDrawer";
import { requireAccess } from "@/lib/access";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatNumber, toDateOnly } from "@/lib/utils";
import CreateLotForm from "@/components/forms/livestock/CreateLotForm";
import UpdateLotForm from "@/components/forms/livestock/UpdateLotForm";

export default async function Page() {
  await requireAccess("livestock");
  const supabase = createServerSupabase();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [
    { count: lotsActiveCount },
    { count: lotsTotalCount },
    { count: deathsCount },
  ] = await Promise.all([
    supabase
      .from("lots")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("lots").select("id", { count: "exact", head: true }),
    supabase
      .from("livestock_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "death")
      .gte("event_date", toDateOnly(since)),
  ]).catch(() => [{ count: 0 }, { count: 0 }, { count: 0 }]);

  const [
    { data: lotsData },
    { data: speciesData },
    { data: breedsData },
    { data: buildingsData },
  ] = await Promise.all([
    supabase
      .from("lots")
      .select(
        "id, name, species_id, breed_id, building_id, batch_code, start_date, initial_count, current_count, status, notes",
      )
      .order("start_date", { ascending: false })
      .limit(8),
    supabase
      .from("species")
      .select("id, name")
      .order("name", { ascending: true }),
    supabase
      .from("breeds")
      .select("id, name, species_id")
      .order("name", { ascending: true }),
    supabase
      .from("buildings")
      .select("id, name")
      .order("name", { ascending: true }),
  ]);

  const lots = lotsData ?? [];
  const species = speciesData ?? [];
  const breeds = breedsData ?? [];
  const buildings = buildingsData ?? [];
  const counts = lots
    .map((lot) => Number(lot.current_count ?? 0))
    .filter((value) => value > 0);
  const avgCount =
    counts.length > 0
      ? Math.round(
          counts.reduce((sum, value) => sum + value, 0) / counts.length,
        )
      : 0;

  return (
    <ModuleShell
      title="Lots d elevage"
      subtitle="Creation, suivi des effectifs et pilotage des performances par lot."
      tag="Elevage"
      tone="from-amber-950 via-amber-700 to-rose-500"
      actions={[
        { label: "Nouveau lot", variant: "primary", href: "?create=lot" },
        { label: "Importer", variant: "outline" },
        { label: "Plan bios", variant: "ghost" },
      ]}
    >
      <AutoRefresh intervalMs={90000} />
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Lots actifs"
          value={formatNumber(lotsActiveCount ?? 0)}
          change={`${formatNumber(lotsTotalCount ?? 0)} total`}
          helper="status actifs"
          tone="amber"
        />
        <MetricCard
          label="Mortalite 30j"
          value={formatNumber(deathsCount ?? 0)}
          change="30j"
          helper="evenements deces"
          tone="rose"
        />
        <MetricCard
          label="Effectif moyen"
          value={avgCount > 0 ? formatNumber(avgCount) : "--"}
          change="auto"
          helper="derniers lots"
          tone="emerald"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Lots principaux
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Suivi des lots actifs
              </h2>
            </div>
            <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Exporter
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {lots.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aucun lot enregistre pour le moment.
              </p>
            ) : (
              lots.map((lot) => (
                <div
                  key={lot.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {lot.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Effectif: {formatNumber(lot.current_count ?? 0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>{lot.status ?? "-"}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px]">
                        {formatDate(lot.start_date)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`?edit=lot&id=${lot.id}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                    >
                      Modifier
                    </a>
                    <a
                      href={`?delete=lot&id=${lot.id}`}
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
            Actions rapides
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Workflow lot
          </h2>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            {[
              { title: "Verifier mortalite", detail: "Revue quotidienne" },
              { title: "Ajuster ration", detail: "Comparer IC par lot" },
              {
                title: "Reconciliation stock",
                detail: "Synchroniser aliments",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="mt-2 text-xs text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CreateLotForm species={species} breeds={breeds} buildings={buildings} />
      <UpdateLotForm
        species={species}
        breeds={breeds}
        buildings={buildings}
        lots={lots}
      />
      <ConfirmDeleteDrawer
        queryValue="lot"
        table="lots"
        title="Supprimer le lot"
        description="Retirez ce lot du suivi d elevage."
        records={lots.map((lot) => ({
          id: lot.id,
          label: lot.name ?? "Lot",
          description: `${lot.status ?? "sans statut"} • demarrage ${formatDate(lot.start_date)}`,
        }))}
      />
    </ModuleShell>
  );
}
