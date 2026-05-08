import ModuleShell from "@/components/dashboard/ModuleShell";
import AutoRefresh from "@/components/dashboard/AutoRefresh";
import CreateInventoryMovementForm from "@/components/forms/inventory/CreateInventoryMovementForm";
import DeleteInventoryMovementForm from "@/components/forms/inventory/DeleteInventoryMovementForm";
import UpdateInventoryMovementForm from "@/components/forms/inventory/UpdateInventoryMovementForm";
import { requireAccess } from "@/lib/access";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatNumber } from "@/lib/utils";

type SearchParams = {
  type?: string;
  item?: string;
  from?: string;
  to?: string;
  q?: string;
};

function resolveItemName(value: unknown) {
  if (!value) return "--";
  if (Array.isArray(value)) return value[0]?.name ?? "--";
  return (value as { name?: string }).name ?? "--";
}

function resolveItemUnit(value: unknown) {
  if (!value) return "";
  if (Array.isArray(value)) return value[0]?.unit ?? "";
  return (value as { unit?: string }).unit ?? "";
}

function resolveUser(value: unknown) {
  if (!value) return "--";
  if (Array.isArray(value))
    return value[0]?.full_name ?? value[0]?.email ?? "--";
  const user = value as { full_name?: string; email?: string };
  return user.full_name ?? user.email ?? "--";
}

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAccess("inventory-movements");
  const supabase = createServerSupabase();

  const { data: itemsData } = await supabase
    .from("inventory_items")
    .select("id, name, unit, current_stock")
    .order("name", { ascending: true });

  const { data: usersData } = await supabase
    .from("users")
    .select("id, full_name, email")
    .order("full_name", { ascending: true });

  let query = supabase
    .from("inventory_movements")
    .select(
      "id, item_id, movement_type, quantity, unit_price, total_cost, movement_date, reference_type, reference_id, created_by, notes, inventory_items(name, unit), users(full_name, email)",
    )
    .order("movement_date", { ascending: false });

  if (searchParams.type) {
    query = query.eq("movement_type", searchParams.type);
  }
  if (searchParams.item) {
    query = query.eq("item_id", searchParams.item);
  }
  if (searchParams.from) {
    query = query.gte("movement_date", searchParams.from);
  }
  if (searchParams.to) {
    query = query.lte("movement_date", searchParams.to);
  }
  if (searchParams.q) {
    query = query.ilike("notes", `%${searchParams.q}%`);
  }

  const { data: movementsData } = await query.limit(50);

  const items = itemsData ?? [];
  const users = (usersData ?? []).map((user) => ({
    id: user.id,
    name: user.full_name ?? user.email ?? "Utilisateur",
  }));
  const movements = (movementsData ?? []).map((movement) => ({
    ...movement,
    item_name: resolveItemName(movement.inventory_items),
  }));

  return (
    <ModuleShell
      title="Mouvements de stock"
      subtitle="Historique des entrees, sorties et ajustements avec filtres."
      tag="Stock"
      tone="from-slate-900 via-slate-700 to-emerald-500"
      actions={[
        {
          label: "Nouveau mouvement",
          variant: "primary",
          href: "?create=movement",
        },
        { label: "Retour inventaire", variant: "outline", href: "/inventory" },
        { label: "Exporter", variant: "ghost" },
      ]}
    >
      <AutoRefresh intervalMs={90000} />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="grid gap-4 md:grid-cols-5" method="get">
          <label className="grid gap-2 text-sm text-slate-600">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Type
            </span>
            <select
              name="type"
              defaultValue={searchParams.type ?? ""}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              <option value="purchase">achat</option>
              <option value="consumption">consommation</option>
              <option value="loss">perte</option>
              <option value="return">retour</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Article
            </span>
            <select
              name="item"
              defaultValue={searchParams.item ?? ""}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Du
            </span>
            <input
              type="date"
              name="from"
              defaultValue={searchParams.from ?? ""}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Au
            </span>
            <input
              type="date"
              name="to"
              defaultValue={searchParams.to ?? ""}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Recherche
            </span>
            <input
              type="text"
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="notes, reference..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-end gap-2 md:col-span-5">
            <button
              type="submit"
              className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              Filtrer
            </button>
            <a
              href="/inventory/movements"
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600"
            >
              Reinitialiser
            </a>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Historique
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">
              Mouvements recents
            </h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            {formatNumber(movements.length)} lignes
          </span>
        </div>
        <div className="mt-6 space-y-3">
          {movements.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun mouvement enregistre.
            </p>
          ) : (
            movements.map((movement) => {
              const itemName = resolveItemName(movement.inventory_items);
              const unit = resolveItemUnit(movement.inventory_items);
              return (
                <div
                  key={movement.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {itemName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {movement.reference_type
                          ? `${movement.reference_type} ${movement.reference_id ?? ""}`.trim()
                          : "Sans reference"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                      <span>{movement.movement_type}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px]">
                        {formatNumber(Number(movement.quantity ?? 0))} {unit}
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-[10px]">
                        {formatDate(movement.movement_date)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500">
                    <span>Responsable: {resolveUser(movement.users)}</span>
                    <span>
                      Montant:{" "}
                      {formatNumber(
                        Math.round(Number(movement.total_cost ?? 0)),
                      )}{" "}
                      FCFA
                    </span>
                  </div>
                  {movement.notes ? (
                    <p className="mt-2 text-xs text-slate-500">
                      {movement.notes}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`?edit=movement&id=${movement.id}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600"
                    >
                      Modifier
                    </a>
                    <a
                      href={`?delete=movement&id=${movement.id}`}
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
      </section>

      <CreateInventoryMovementForm items={items} users={users} />
      <UpdateInventoryMovementForm
        items={items}
        users={users}
        movements={movements}
      />
      <DeleteInventoryMovementForm movements={movements} />
    </ModuleShell>
  );
}
