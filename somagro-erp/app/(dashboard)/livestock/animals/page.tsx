import ModuleShell from "@/components/dashboard/ModuleShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import ConfirmDeleteDrawer from "@/components/forms/ConfirmDeleteDrawer";
import { requireAccess } from "@/lib/access";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/utils";
import CreateAnimalForm from "@/components/forms/livestock/CreateAnimalForm";
import UpdateAnimalForm from "@/components/forms/livestock/UpdateAnimalForm";

export default async function Page() {
  await requireAccess("livestock");
  const supabase = createServerSupabase();

  const [{ count: totalAnimals }, { count: alertAnimals }] = await Promise.all([
    supabase.from("animals").select("id", { count: "exact", head: true }),
    supabase
      .from("animals")
      .select("id", { count: "exact", head: true })
      .neq("health_status", "healthy"),
  ]).catch(() => [{ count: 0 }, { count: 0 }]);

  const [{ data: animalsData }, { data: lotsData }] = await Promise.all([
    supabase
      .from("animals")
      .select(
        "id, identification_number, lot_id, rfid_tag, weight_kg, health_status, birth_date, notes",
      )
      .order("birth_date", { ascending: false })
      .limit(8),
    supabase.from("lots").select("id, name").order("name", { ascending: true }),
  ]);

  const animals = animalsData ?? [];
  const lots = lotsData ?? [];
  const weightValues = animals
    .map((animal) => Number(animal.weight_kg ?? 0))
    .filter((value) => value > 0);
  const averageWeight =
    weightValues.length > 0
      ? weightValues.reduce((sum, value) => sum + value, 0) /
        weightValues.length
      : 0;

  return (
    <ModuleShell
      title="Animaux"
      subtitle="Suivi individuel, identification et historique des interventions."
      tag="Elevage"
      tone="from-slate-900 via-slate-700 to-emerald-500"
      actions={[
        { label: "Nouvel animal", variant: "primary", href: "?create=animal" },
        { label: "Scanner RFID", variant: "outline" },
        { label: "Exporter", variant: "ghost" },
      ]}
    >
      <AutoRefresh intervalMs={90000} />
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Animaux identifies"
          value={formatNumber(totalAnimals ?? 0)}
          change="total"
          helper="base elevage"
          tone="emerald"
        />
        <MetricCard
          label="Poids moyen"
          value={
            averageWeight > 0
              ? `${formatNumber(Number(averageWeight.toFixed(1)))} kg`
              : "--"
          }
          change="auto"
          helper="sur derniers enregistrements"
          tone="sky"
        />
        <MetricCard
          label="Alertes sante"
          value={formatNumber(alertAnimals ?? 0)}
          change="actif"
          helper="surveillance"
          tone="rose"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Tableau individuel
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Animaux suivis
              </h2>
            </div>
            <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Filtrer
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {animals.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun animal enregistre.</p>
            ) : (
              animals.map((animal) => (
                <div
                  key={animal.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {animal.identification_number ?? animal.id}
                      </p>
                      <p className="text-xs text-slate-500">
                        Poids: {animal.weight_kg ?? "--"} kg
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>{animal.health_status ?? "--"}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`?edit=animal&id=${animal.id}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                    >
                      Modifier
                    </a>
                    <a
                      href={`?delete=animal&id=${animal.id}`}
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
            Synthese
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Historique recent
          </h2>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            {animals.slice(0, 3).map((animal) => (
              <div
                key={animal.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <p className="font-medium text-slate-900">
                  {animal.identification_number ?? animal.id}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Etat: {animal.health_status ?? "--"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`?edit=animal&id=${animal.id}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                  >
                    Modifier
                  </a>
                  <a
                    href={`?delete=animal&id=${animal.id}`}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-700"
                  >
                    Supprimer
                  </a>
                </div>
              </div>
            ))}
            {animals.length === 0 && (
              <p className="text-xs text-slate-500">Historique indisponible.</p>
            )}
          </div>
        </div>
      </section>
      <CreateAnimalForm lots={lots} />
      <UpdateAnimalForm lots={lots} animals={animals} />
      <ConfirmDeleteDrawer
        queryValue="animal"
        table="animals"
        title="Supprimer l animal"
        description="Retirez cette fiche individuelle du registre elevage."
        records={animals.map((animal) => ({
          id: animal.id,
          label: animal.identification_number ?? animal.rfid_tag ?? animal.id,
          description: `${animal.health_status ?? "sans statut"} • ${animal.weight_kg ?? "--"} kg`,
        }))}
      />
    </ModuleShell>
  );
}
