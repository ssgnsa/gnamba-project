import ModuleShell from "@/components/dashboard/ModuleShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import ConfirmDeleteDrawer from "@/components/forms/ConfirmDeleteDrawer";
import { requireAccess } from "@/lib/access";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatNumber, formatPercent } from "@/lib/utils";
import CreateFieldForm from "@/components/forms/crops/CreateFieldForm";
import UpdateFieldForm from "@/components/forms/crops/UpdateFieldForm";

export default async function Page() {
  await requireAccess("crops");
  const supabase = createServerSupabase();

  const { data } = await supabase
    .from("fields")
    .select("id, name, area_hectares, soil_type, status, notes")
    .order("name", { ascending: true });

  const fields = data ?? [];
  const totalArea = fields.reduce(
    (sum, field) => sum + Number(field.area_hectares ?? 0),
    0,
  );
  const activeCount = fields.filter(
    (field) => field.status === "active",
  ).length;
  const inactiveCount = fields.filter(
    (field) => field.status && field.status !== "active",
  ).length;
  const activityRate =
    fields.length > 0 ? (activeCount / fields.length) * 100 : 0;

  const topFields = [...fields]
    .sort((a, b) => Number(b.area_hectares ?? 0) - Number(a.area_hectares ?? 0))
    .slice(0, 6);
  const maxArea = Math.max(
    1,
    ...topFields.map((field) => Number(field.area_hectares ?? 0)),
  );

  const priorityFields = fields
    .filter((field) => field.status && field.status !== "active")
    .slice(0, 3);
  const fallbackFields =
    priorityFields.length > 0 ? priorityFields : topFields.slice(0, 3);

  return (
    <ModuleShell
      title="Parcelles"
      subtitle="Superficie, sols, coordonnees GPS et etat de chaque parcelle."
      tag="Cultures"
      tone="from-emerald-950 via-emerald-700 to-teal-400"
      actions={[
        {
          label: "Nouvelle parcelle",
          variant: "primary",
          href: "?create=field",
        },
        { label: "Importer GPS", variant: "outline" },
        { label: "Cartes", variant: "ghost" },
      ]}
    >
      <AutoRefresh intervalMs={90000} />
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Surface totale"
          value={`${formatNumber(totalArea)} ha`}
          change="tous sites"
          helper="somagro"
          tone="emerald"
        />
        <MetricCard
          label="Parcelles actives"
          value={formatNumber(activeCount)}
          change={formatPercent(activityRate)}
          helper="taux activite"
          tone="sky"
        />
        <MetricCard
          label="Hors production"
          value={formatNumber(inactiveCount)}
          change={`${formatNumber(fields.length)} total`}
          helper="jachere ou retire"
          tone="amber"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Carte dynamique
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Vue globale des parcelles
              </h2>
            </div>
            <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Voir details
            </button>
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6">
            {topFields.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aucune parcelle enregistree.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{topFields[0]?.name ?? "Parcelle"}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] uppercase text-emerald-700">
                    {formatNumber(topFields[0]?.area_hectares ?? 0)} ha
                  </span>
                </div>
                <div className="mt-4 flex items-end gap-2">
                  {topFields.map((field) => {
                    const height =
                      Math.round(
                        (Number(field.area_hectares ?? 0) / maxArea) * 96,
                      ) + 16;
                    return (
                      <div
                        key={field.id}
                        className="w-6 rounded-full bg-emerald-400/70"
                        style={{ height: `${height}px` }}
                        title={`${field.name} - ${formatNumber(field.area_hectares ?? 0)} ha`}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Parcelles prioritaires
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Actions terrain
          </h2>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            {fallbackFields.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aucune parcelle a suivre.
              </p>
            ) : (
              fallbackFields.map((field) => (
                <div
                  key={field.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <p className="font-medium text-slate-900">{field.name}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Statut: {field.status ?? "--"} · Sol:{" "}
                    {field.soil_type ?? "non renseigne"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`?edit=field&id=${field.id}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                    >
                      Modifier
                    </a>
                    <a
                      href={`?delete=field&id=${field.id}`}
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
      <CreateFieldForm />
      <UpdateFieldForm fields={fields} />
      <ConfirmDeleteDrawer
        queryValue="field"
        table="fields"
        title="Supprimer la parcelle"
        description="Retirez cette parcelle de la base fonciere de production."
        records={fields.map((field) => ({
          id: field.id,
          label: field.name ?? "Parcelle",
          description: `${formatNumber(field.area_hectares ?? 0)} ha • ${field.status ?? "sans statut"}`,
        }))}
      />
    </ModuleShell>
  );
}
