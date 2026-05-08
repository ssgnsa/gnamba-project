import ModuleShell from "@/components/dashboard/ModuleShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import ConfirmDeleteDrawer from "@/components/forms/ConfirmDeleteDrawer";
import { requireAccess } from "@/lib/access";
import CreateEquipmentForm from "@/components/forms/constructions/CreateEquipmentForm";
import UpdateEquipmentForm from "@/components/forms/constructions/UpdateEquipmentForm";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatNumber } from "@/lib/utils";

function isDue(lastDate?: string | null, interval?: number | null) {
  if (!lastDate || !interval) return false;
  const last = new Date(lastDate);
  if (Number.isNaN(last.getTime())) return false;
  const due = new Date(last);
  due.setDate(due.getDate() + interval);
  return due <= new Date();
}

function resolveName(value: unknown) {
  if (!value) return "--";
  if (Array.isArray(value)) return value[0]?.name ?? "--";
  return (value as { name?: string }).name ?? "--";
}

export default async function Page() {
  await requireAccess("constructions");
  const supabase = createServerSupabase();

  const { data: equipmentData } = await supabase
    .from("equipment")
    .select(
      "id, name, building_id, equipment_type, brand, model, serial_number, installation_date, warranty_end, maintenance_interval_days, last_maintenance_date, status, notes, buildings(name)",
    )
    .order("name", { ascending: true })
    .limit(12);

  const { data: buildingsData } = await supabase
    .from("buildings")
    .select("id, name")
    .order("name", { ascending: true });

  const equipment = equipmentData ?? [];
  const buildings = buildingsData ?? [];
  const dueCount = equipment.filter((item) =>
    isDue(item.last_maintenance_date, item.maintenance_interval_days),
  ).length;
  const criticalCount = equipment.filter(
    (item) => item.status && item.status !== "operational",
  ).length;
  const openCount = dueCount + criticalCount;

  return (
    <ModuleShell
      title="Maintenance"
      subtitle="Suivi des equipements, interventions et calendriers preventifs."
      tag="Constructions"
      tone="from-slate-900 via-slate-700 to-amber-500"
      actions={[
        {
          label: "Nouvel equipement",
          variant: "primary",
          href: "?create=equipment",
        },
        { label: "Planning", variant: "outline" },
        { label: "Pieces", variant: "ghost" },
      ]}
    >
      <AutoRefresh intervalMs={90000} />
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Maintenances ouvertes"
          value={formatNumber(openCount)}
          change="a traiter"
          helper="due + critiques"
          tone="rose"
        />
        <MetricCard
          label="Equipements critiques"
          value={formatNumber(criticalCount)}
          change="statut"
          helper="non operationnel"
          tone="amber"
        />
        <MetricCard
          label="Echeances"
          value={formatNumber(dueCount)}
          change="a faire"
          helper="calendrier"
          tone="emerald"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Equipements
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Suivi maintenance
              </h2>
            </div>
            <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Exporter
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {equipment.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aucun equipement enregistre.
              </p>
            ) : (
              equipment.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Site: {resolveName(item.buildings)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>{item.status ?? "--"}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px]">
                        {formatDate(item.last_maintenance_date)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`?edit=equipment&id=${item.id}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                    >
                      Modifier
                    </a>
                    <a
                      href={`?delete=equipment&id=${item.id}`}
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
            Priorites
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Actions critiques
          </h2>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            {equipment.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Statut: {item.status ?? "--"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`?edit=equipment&id=${item.id}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                  >
                    Modifier
                  </a>
                  <a
                    href={`?delete=equipment&id=${item.id}`}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-700"
                  >
                    Supprimer
                  </a>
                </div>
              </div>
            ))}
            {equipment.length === 0 && (
              <p className="text-xs text-slate-500">
                Aucune priorite en cours.
              </p>
            )}
          </div>
        </div>
      </section>
      <CreateEquipmentForm buildings={buildings} />
      <UpdateEquipmentForm buildings={buildings} equipment={equipment} />
      <ConfirmDeleteDrawer
        queryValue="equipment"
        table="equipment"
        title="Supprimer l equipement"
        description="Retirez cet equipement du suivi de maintenance."
        records={equipment.map((item) => ({
          id: item.id,
          label: item.name ?? "Equipement",
          description: `${item.status ?? "sans statut"} • ${resolveName(item.buildings)}`,
        }))}
      />
    </ModuleShell>
  );
}
