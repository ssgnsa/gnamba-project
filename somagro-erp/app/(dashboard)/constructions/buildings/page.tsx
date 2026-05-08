import ModuleShell from "@/components/dashboard/ModuleShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import ConfirmDeleteDrawer from "@/components/forms/ConfirmDeleteDrawer";
import { requireAccess } from "@/lib/access";
import CreateBuildingForm from "@/components/forms/constructions/CreateBuildingForm";
import CreateBuildingTypeForm from "@/components/forms/constructions/CreateBuildingTypeForm";
import UpdateBuildingForm from "@/components/forms/constructions/UpdateBuildingForm";
import UpdateBuildingTypeForm from "@/components/forms/constructions/UpdateBuildingTypeForm";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatNumber, formatPercent } from "@/lib/utils";

export default async function Page() {
  await requireAccess("constructions");
  const supabase = createServerSupabase();

  const { data: buildingsData } = await supabase
    .from("buildings")
    .select(
      "id, name, building_type_id, status, code, construction_date, capacity, current_occupancy, notes, building_types(name)",
    )
    .order("name", { ascending: true })
    .limit(20);

  const { data: typesData } = await supabase
    .from("building_types")
    .select("id, name, category")
    .order("name", { ascending: true });

  const buildings = buildingsData ?? [];
  const types = typesData ?? [];
  const totalCount = buildings.length;
  const operationalCount = buildings.filter(
    (building) => building.status === "operational",
  ).length;
  const maintenanceCount = buildings.filter(
    (building) => building.status === "maintenance",
  ).length;
  const totalCapacity = buildings.reduce(
    (sum, building) => sum + Number(building.capacity ?? 0),
    0,
  );
  const totalOccupancy = buildings.reduce(
    (sum, building) => sum + Number(building.current_occupancy ?? 0),
    0,
  );
  const occupancyRate =
    totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

  const topBuildings = [...buildings]
    .sort((a, b) => {
      const ratioA =
        Number(a.current_occupancy ?? 0) / Math.max(1, Number(a.capacity ?? 0));
      const ratioB =
        Number(b.current_occupancy ?? 0) / Math.max(1, Number(b.capacity ?? 0));
      return ratioB - ratioA;
    })
    .slice(0, 6);

  const resolveTypeName = (value: unknown) => {
    if (!value) return "--";
    if (Array.isArray(value)) return value[0]?.name ?? "--";
    return (value as { name?: string }).name ?? "--";
  };

  return (
    <ModuleShell
      title="Batiments"
      subtitle="Capacites, occupation et suivi des infrastructures."
      tag="Constructions"
      tone="from-slate-900 via-slate-700 to-emerald-500"
      actions={[
        {
          label: "Nouveau batiment",
          variant: "primary",
          href: "?create=building",
        },
        {
          label: "Nouveau type",
          variant: "outline",
          href: "?create=building-type",
        },
        { label: "Plans", variant: "ghost" },
      ]}
    >
      <AutoRefresh intervalMs={90000} />
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Batiments operationnels"
          value={formatNumber(operationalCount)}
          change={`${formatNumber(totalCount)} total`}
          helper="sites actifs"
          tone="sky"
        />
        <MetricCard
          label="Occupation"
          value={formatPercent(occupancyRate)}
          change="capacite"
          helper="moyenne"
          tone="emerald"
        />
        <MetricCard
          label="Alertes maintenance"
          value={formatNumber(maintenanceCount)}
          change="statut"
          helper="a planifier"
          tone="rose"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Occupation
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Batiments prioritaires
              </h2>
            </div>
            <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Voir tout
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {topBuildings.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aucun batiment enregistre.
              </p>
            ) : (
              topBuildings.map((building) => {
                const capacity = Number(building.capacity ?? 0);
                const occupancy = Number(building.current_occupancy ?? 0);
                const ratio =
                  capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0;
                return (
                  <div
                    key={building.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {building.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Type: {resolveTypeName(building.building_types)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                        <span>{ratio}%</span>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px]">
                          {formatNumber(occupancy)}/{formatNumber(capacity)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={`?edit=building&id=${building.id}`}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                      >
                        Modifier
                      </a>
                      <a
                        href={`?delete=building&id=${building.id}`}
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-700"
                      >
                        Supprimer
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Etat global
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Points de controle
          </h2>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            {buildings.slice(0, 3).map((building) => (
              <div
                key={building.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <p className="font-medium text-slate-900">{building.name}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Statut: {building.status ?? "--"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`?edit=building&id=${building.id}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                  >
                    Modifier
                  </a>
                  <a
                    href={`?delete=building&id=${building.id}`}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-700"
                  >
                    Supprimer
                  </a>
                </div>
              </div>
            ))}
            {buildings.length === 0 && (
              <p className="text-xs text-slate-500">
                Aucun batiment a controler.
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Referentiel
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">
              Types de batiments
            </h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            {formatNumber(types.length)} types
          </span>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {types.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun type de batiment defini.
            </p>
          ) : (
            types.map((type) => (
              <div
                key={type.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {type.name}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Categorie: {type.category ?? "--"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`?edit=building-type&id=${type.id}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                  >
                    Modifier
                  </a>
                  <a
                    href={`?delete=building-type&id=${type.id}`}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-700"
                  >
                    Supprimer
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      <CreateBuildingForm types={types} />
      <CreateBuildingTypeForm />
      <UpdateBuildingForm
        types={types.map((type) => ({
          id: type.id,
          name: type.name ?? "Type",
        }))}
        buildings={buildings}
      />
      <UpdateBuildingTypeForm types={types} />
      <ConfirmDeleteDrawer
        queryValue="building"
        table="buildings"
        title="Supprimer le batiment"
        description="Retirez cette infrastructure du parc immobilier."
        records={buildings.map((building) => ({
          id: building.id,
          label: building.name ?? "Batiment",
          description: `${resolveTypeName(building.building_types)} • ${building.status ?? "sans statut"}`,
        }))}
      />
      <ConfirmDeleteDrawer
        queryValue="building-type"
        table="building_types"
        title="Supprimer le type de batiment"
        description="Retirez ce type s il n est plus utilise dans vos infrastructures."
        records={types.map((type) => ({
          id: type.id,
          label: type.name ?? "Type de batiment",
          description: type.category ?? "Sans categorie",
        }))}
      />
    </ModuleShell>
  );
}
