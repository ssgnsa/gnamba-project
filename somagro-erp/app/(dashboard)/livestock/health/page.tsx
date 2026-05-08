import ModuleShell from "@/components/dashboard/ModuleShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import ConfirmDeleteDrawer from "@/components/forms/ConfirmDeleteDrawer";
import { requireAccess } from "@/lib/access";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatNumber } from "@/lib/utils";
import CreateHealthRecordForm from "@/components/forms/livestock/CreateHealthRecordForm";
import UpdateHealthRecordForm from "@/components/forms/livestock/UpdateHealthRecordForm";

export default async function Page() {
  await requireAccess("livestock");
  const supabase = createServerSupabase();
  const today = new Date().toISOString();

  const [{ count: treatmentsCount }, { count: upcomingCount }] =
    await Promise.all([
      supabase
        .from("health_records")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("health_records")
        .select("id", { count: "exact", head: true })
        .gte("next_due_date", today),
    ]).catch(() => [{ count: 0 }, { count: 0 }]);

  const [
    { data: recordsData },
    { data: lotsData },
    { data: animalsData },
    { data: medsData },
    { data: usersData },
  ] = await Promise.all([
    supabase
      .from("health_records")
      .select(
        "id, record_type, lot_id, animal_id, diagnosis, treatment, medication_id, dosage, withdrawal_days, administered_by, administered_date, next_due_date, notes",
      )
      .order("administered_date", { ascending: false })
      .limit(8),
    supabase.from("lots").select("id, name").order("name", { ascending: true }),
    supabase
      .from("animals")
      .select("id, identification_number")
      .order("identification_number", { ascending: true })
      .limit(200),
    supabase
      .from("inventory_items")
      .select("id, name")
      .order("name", { ascending: true }),
    supabase
      .from("users")
      .select("id, full_name")
      .order("full_name", { ascending: true }),
  ]);

  const records = recordsData ?? [];
  const lots = lotsData ?? [];
  const animals = (animalsData ?? []).map((animal) => ({
    id: animal.id,
    name: animal.identification_number ?? animal.id,
  }));
  const medications = medsData ?? [];
  const users = usersData ?? [];

  return (
    <ModuleShell
      title="Sante animale"
      subtitle="Traitements, vaccinations et delais de retrait par lot."
      tag="Elevage"
      tone="from-rose-950 via-rose-700 to-orange-400"
      actions={[
        {
          label: "Nouveau traitement",
          variant: "primary",
          href: "?create=health",
        },
        { label: "Plan vaccins", variant: "outline" },
        { label: "Alertes", variant: "ghost" },
      ]}
    >
      <AutoRefresh intervalMs={90000} />
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Traitements en cours"
          value={formatNumber(treatmentsCount ?? 0)}
          change="total"
          helper="enregistrements"
          tone="rose"
        />
        <MetricCard
          label="Echeances"
          value={formatNumber(upcomingCount ?? 0)}
          change="a venir"
          helper="prochains soins"
          tone="amber"
        />
        <MetricCard
          label="Delai retrait"
          value="--"
          change="auto"
          helper="a calculer"
          tone="sky"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Protocoles
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Traitements recents
              </h2>
            </div>
            <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Exporter
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {records.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aucune fiche sante disponible.
              </p>
            ) : (
              records.map((record) => (
                <div
                  key={record.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {record.record_type ?? "traitement"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {record.diagnosis ?? "Diagnostic"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>{formatDate(record.administered_date)}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px]">
                        {formatDate(record.next_due_date)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`?edit=health&id=${record.id}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                    >
                      Modifier
                    </a>
                    <a
                      href={`?delete=health&id=${record.id}`}
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
            {records.slice(0, 3).map((record) => (
              <div
                key={record.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <p className="font-medium text-slate-900">
                  {record.record_type ?? "Suivi"}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Echeance: {formatDate(record.next_due_date)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`?edit=health&id=${record.id}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                  >
                    Modifier
                  </a>
                  <a
                    href={`?delete=health&id=${record.id}`}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-700"
                  >
                    Supprimer
                  </a>
                </div>
              </div>
            ))}
            {records.length === 0 && (
              <p className="text-xs text-slate-500">
                Aucune priorite en cours.
              </p>
            )}
          </div>
        </div>
      </section>
      <CreateHealthRecordForm
        lots={lots}
        animals={animals}
        medications={medications}
        users={users}
      />
      <UpdateHealthRecordForm
        lots={lots}
        animals={animals}
        medications={medications}
        users={users}
        records={records}
      />
      <ConfirmDeleteDrawer
        queryValue="health"
        table="health_records"
        title="Supprimer l acte veterinaire"
        description="Retirez cet acte du registre de sante animale."
        records={records.map((record) => ({
          id: record.id,
          label: record.record_type ?? "Acte veterinaire",
          description: `${formatDate(record.administered_date)} • ${record.diagnosis ?? "Sans diagnostic"}`,
        }))}
      />
    </ModuleShell>
  );
}
