import ModuleShell from "@/components/dashboard/ModuleShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import ConfirmDeleteDrawer from "@/components/forms/ConfirmDeleteDrawer";
import { requireAccess } from "@/lib/access";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatNumber } from "@/lib/utils";
import CreateLivestockEventForm from "@/components/forms/livestock/CreateLivestockEventForm";

const EVENT_TYPE_LABELS: Record<string, string> = {
  birth: "naissance",
  death: "deces",
  sale: "vente",
  purchase: "achat",
  transfer_in: "transfert entree",
  transfer_out: "transfert sortie",
};

const EVENT_TYPE_TONES: Record<string, string> = {
  birth: "bg-emerald-100 text-emerald-700",
  death: "bg-rose-100 text-rose-700",
  sale: "bg-amber-100 text-amber-700",
  purchase: "bg-sky-100 text-sky-700",
  transfer_in: "bg-violet-100 text-violet-700",
  transfer_out: "bg-orange-100 text-orange-700",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireAccess("livestock");
  const supabase = createServerSupabase();
  const params = await searchParams;
  const typeFilter = params?.type;

  let eventsQuery = supabase
    .from("livestock_events")
    .select(
      "id, event_type, lot_id, animal_id, quantity, event_date, reason, weight_kg, price, created_by, notes",
    )
    .order("event_date", { ascending: false })
    .limit(10);

  if (typeFilter) {
    eventsQuery = eventsQuery.eq("event_type", typeFilter);
  }

  const [
    { count: totalEvents },
    { count: birthsCount },
    { count: deathsCount },
    { count: salesCount },
    { data: eventsData },
    { data: lotsData },
    { data: animalsData },
    { data: usersData },
  ] = await Promise.all([
    supabase
      .from("livestock_events")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("livestock_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "birth"),
    supabase
      .from("livestock_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "death"),
    supabase
      .from("livestock_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "sale"),
    eventsQuery,
    supabase.from("lots").select("id, name").order("name", { ascending: true }),
    supabase
      .from("animals")
      .select("id, identification_number")
      .order("identification_number", { ascending: true })
      .limit(200),
    supabase
      .from("users")
      .select("id, full_name")
      .order("full_name", { ascending: true }),
  ]).catch(() => [
    { count: 0 },
    { count: 0 },
    { count: 0 },
    { count: 0 },
    { data: [] },
    { data: [] },
    { data: [] },
    { data: [] },
  ]);

  const events = eventsData ?? [];
  const lots = lotsData ?? [];
  const animals = (animalsData ?? []).map((animal) => ({
    id: animal.id,
    name: animal.identification_number ?? animal.id,
  }));
  const users = usersData ?? [];

  const lotsMap = new Map(lots.map((lot) => [lot.id, lot.name]));
  const animalsMap = new Map(animals.map((animal) => [animal.id, animal.name]));
  return (
    <ModuleShell
      title="Evenements elevage"
      subtitle="Naissances, deces, ventes et mouvements du betail."
      tag="Elevage"
      tone="from-emerald-950 via-emerald-700 to-amber-400"
      actions={[
        {
          label: "Nouvel evenement",
          variant: "primary",
          href: "?create=event",
        },
        { label: "Registre complet", variant: "outline" },
        { label: "Exporter", variant: "ghost" },
      ]}
    >
      <AutoRefresh intervalMs={90000} />
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Total evenements"
          value={formatNumber(totalEvents ?? 0)}
          change="cumule"
          helper="tous types"
          tone="slate"
        />
        <MetricCard
          label="Naissances"
          value={formatNumber(birthsCount ?? 0)}
          change="naissances"
          helper="enregistrees"
          tone="emerald"
        />
        <MetricCard
          label="Deces"
          value={formatNumber(deathsCount ?? 0)}
          change="mortalite"
          helper="declares"
          tone="rose"
        />
        <MetricCard
          label="Ventes"
          value={formatNumber(salesCount ?? 0)}
          change="cedees"
          helper="vendues"
          tone="amber"
        />
      </section>

      <section className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Filtrer:
        </span>
        <a
          href="?create=event"
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-600"
        >
          Tous
        </a>
        {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
          <a
            key={value}
            href={`?type=${value}`}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] ${typeFilter === value ? "border-2 border-slate-800 bg-slate-800 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
          >
            {label}
          </a>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Registre
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">
              Evenements recents
            </h2>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          {events.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun evenement enregistre.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Animal / Lot</th>
                  <th className="pb-3 font-medium">Qte</th>
                  <th className="pb-3 font-medium">Poids</th>
                  <th className="pb-3 font-medium">Prix</th>
                  <th className="pb-3 font-medium">Notes</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((event) => {
                  const label =
                    EVENT_TYPE_LABELS[event.event_type] ?? event.event_type;
                  const tone =
                    EVENT_TYPE_TONES[event.event_type] ??
                    "bg-slate-100 text-slate-700";
                  const entityName = event.animal_id
                    ? (animalsMap.get(event.animal_id) ?? "Animal")
                    : event.lot_id
                      ? (lotsMap.get(event.lot_id) ?? "Lot")
                      : "Non assigne";

                  return (
                    <tr key={event.id} className="align-top">
                      <td className="py-3 text-xs text-slate-600">
                        {formatDate(event.event_date)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${tone}`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-slate-900">
                        {entityName}
                      </td>
                      <td className="py-3 text-xs text-slate-600">
                        {event.quantity}
                      </td>
                      <td className="py-3 text-xs text-slate-600">
                        {event.weight_kg ? `${event.weight_kg} kg` : "--"}
                      </td>
                      <td className="py-3 text-xs text-slate-600">
                        {event.price
                          ? `${formatNumber(event.price)} FCFA`
                          : "--"}
                      </td>
                      <td className="max-w-[200px] py-3 text-xs text-slate-500">
                        {event.notes ?? event.reason ?? "--"}
                      </td>
                      <td className="py-3 text-right">
                        <a
                          href={`?delete=event&id=${event.id}`}
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-700"
                        >
                          Supprimer
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
      <CreateLivestockEventForm lots={lots} animals={animals} users={users} />
      <ConfirmDeleteDrawer
        queryValue="event"
        table="livestock_events"
        title="Supprimer l'evenement"
        description="Retirez cet evenement du registre elevage."
        records={events.map((event) => ({
          id: event.id,
          label: EVENT_TYPE_LABELS[event.event_type] ?? "Evenement",
          description: `${formatDate(event.event_date)} • ${event.notes ?? "Sans note"}`,
        }))}
      />
    </ModuleShell>
  );
}
